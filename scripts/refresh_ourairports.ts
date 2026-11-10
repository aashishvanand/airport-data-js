/**
 * Refreshes data/airports.json against the latest OurAirports export.
 *
 * What it does:
 *   1. Fills `city` (OurAirports `municipality`) and `city_code` (IATA metro/city
 *      code from data_source/seatsaero_new.json) on every record.
 *   2. Sets the IATA code on existing records whose IATA is empty when OurAirports
 *      has one for the same ICAO and the code is not already used.
 *   3. Adds airports whose IATA code is missing from the dataset when they have
 *      scheduled service (or are listed explicitly with --add).
 *   4. Reports, without changing, IATA codes that differ between the dataset and
 *      OurAirports so a human can review them.
 *
 * Usage:
 *   npx tsx scripts/refresh_ourairports.ts [--csv path] [--runways path]
 *       [--add FSH,BZJ] [--write] [--summary path]
 *
 * Without --write the script only prints the diff (dry run).
 * --summary writes a Markdown summary (used by the weekly refresh workflow).
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import type { Airport } from '../src/index';

const OURAIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const RUNWAYS_URL = 'https://davidmegginson.github.io/ourairports-data/runways.csv';

const ROOT = path.join(__dirname, '..');
const AIRPORTS_JSON = path.join(ROOT, 'data/airports.json');
const SEATSAERO_JSON = path.join(ROOT, 'data_source/seatsaero_new.json');

/** IATA metro assignments that the city-code source is missing (keyed by airport IATA). */
const CITY_CODE_OVERRIDES: Record<string, string> = {
    EWR: 'NYC',
};

/** City names where the OurAirports municipality is misleading (keyed by ICAO). */
const CITY_OVERRIDES: Record<string, string> = {
    KTKI: 'McKinney', // OurAirports lists "Dallas"
};

/**
 * IATA mismatches that were reviewed and intentionally kept (keyed by ICAO).
 * They are left out of the "to review" list.
 */
const ACKNOWLEDGED_IATA_MISMATCHES: Record<string, string> = {
    // OurAirports' HEBA row (Borg El Arab, IATA HBE) lists ICAO HEAX, which is El Nouzha (ALY).
    // The dataset keeps both airports as separate records.
    HEAX: 'ALY',
};

/** A source record only counts as the same airport if it is within this distance. */
const MAX_MATCH_DISTANCE_KM = 50;

/** The legacy `utc` field is a July snapshot; new records follow the same convention. */
const UTC_SNAPSHOT_DATE = new Date(Date.UTC(2024, 6, 15, 12));

const TYPES_ALLOWED_FOR_AUTO_ADD = new Set(['large_airport', 'medium_airport', 'small_airport']);

interface OARow {
    ident: string;
    type: string;
    name: string;
    latitude_deg: string;
    longitude_deg: string;
    elevation_ft: string;
    continent: string;
    iso_country: string;
    municipality: string;
    scheduled_service: string;
    icao_code: string;
    iata_code: string;
    gps_code: string;
    home_link: string;
    wikipedia_link: string;
}

interface RunwayRow {
    airport_ident: string;
    length_ft: string;
    closed: string;
}

type AirportRecord = Airport & { city: string; city_code: string };

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function argValue(name: string): string | undefined {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

const WRITE = process.argv.includes('--write');
const EXTRA_ADDS = new Set((argValue('--add') || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
const SUMMARY_PATH = argValue('--summary');

async function loadText(localPath: string | undefined, url: string): Promise<string> {
    if (localPath) return fs.readFileSync(localPath, 'utf8');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
    return res.text();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function utcOffsetHours(timeZone: string, date: Date): number {
    const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
        .formatToParts(date)
        .find(p => p.type === 'timeZoneName')!.value;
    const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === '-' ? -1 : 1;
    return sign * (Number(m[2]) + Number(m[3] || 0) / 60);
}

function isValidTimeZone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

function cleanName(name: string): string {
    return name.replace(/\s*\((under construction|planned)\)\s*/i, ' ').trim();
}

function num(value: string): number | null {
    if (value === '' || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function icaoFor(row: OARow): string {
    const candidate = row.icao_code || row.gps_code;
    return /^[A-Z]{4}$/.test(candidate) ? candidate : '';
}

function trackingUrls(iata: string, icao: string) {
    return {
        flightradar24_url: iata ? `https://www.flightradar24.com/airport/${iata}` : '',
        radarbox_url: icao ? `https://www.radarbox.com/airport/${icao}` : '',
        flightaware_url: icao ? `https://www.flightaware.com/live/airport/${icao}` : '',
    };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const r = Math.PI / 180;
    const dLat = (lat2 - lat1) * r;
    const dLon = (lon2 - lon1) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Timezone of the nearest existing airport in the same country (OurAirports has no tz column). */
function guessTimeZone(data: AirportRecord[], country: string, lat: number, lon: number): string {
    let best = '';
    let bestDist = Infinity;
    for (const a of data) {
        if (a.country_code !== country || !isValidTimeZone(a.time)) continue;
        const d = haversine(lat, lon, a.latitude, a.longitude);
        if (d < bestDist) {
            bestDist = d;
            best = a.time;
        }
    }
    return best;
}

/** Pretty JSON with non-ASCII escaped as \uXXXX, matching the existing file format. */
function toAsciiJson(value: unknown): string {
    return JSON.stringify(value, null, 2).replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const oaRows = parse(await loadText(argValue('--csv'), OURAIRPORTS_URL), { columns: true, skip_empty_lines: true }) as OARow[];
    const runwayRows = parse(await loadText(argValue('--runways'), RUNWAYS_URL), { columns: true, skip_empty_lines: true }) as RunwayRow[];
    const data = JSON.parse(fs.readFileSync(AIRPORTS_JSON, 'utf8')) as AirportRecord[];

    const seatsaero = fs.existsSync(SEATSAERO_JSON)
        ? (JSON.parse(fs.readFileSync(SEATSAERO_JSON, 'utf8')) as Array<{ iata: string; city_code: string; latitude: string; longitude: string }>)
        : [];
    const seatsaeroByIata = new Map<string, { city_code: string; lat: number; lon: number }>();
    for (const s of seatsaero) {
        if (s.iata && /^[A-Z]{3}$/.test(s.city_code || '')) {
            seatsaeroByIata.set(s.iata, { city_code: s.city_code, lat: Number(s.latitude), lon: Number(s.longitude) });
        }
    }
    /** City code for an IATA code at a location; ignores source records for a different airport that reuses the code. */
    const cityCodeFor = (iata: string, lat: number, lon: number): string => {
        if (!iata) return '';
        if (CITY_CODE_OVERRIDES[iata]) return CITY_CODE_OVERRIDES[iata];
        const s = seatsaeroByIata.get(iata);
        return s && haversine(lat, lon, s.lat, s.lon) <= MAX_MATCH_DISTANCE_KM ? s.city_code : '';
    };

    const longestRunway = new Map<string, number>();
    for (const r of runwayRows) {
        const len = num(r.length_ft);
        if (r.closed === '1' || len === null) continue;
        if (len > (longestRunway.get(r.airport_ident) ?? 0)) longestRunway.set(r.airport_ident, len);
    }

    const oaByCode = new Map<string, OARow>();
    const oaByIata = new Map<string, OARow>();
    for (const row of oaRows) {
        for (const code of [row.gps_code, row.icao_code, row.ident]) {
            if (code && !oaByCode.has(code)) oaByCode.set(code, row);
        }
        if (row.iata_code && !oaByIata.has(row.iata_code)) oaByIata.set(row.iata_code, row);
    }

    const usedIata = new Set(data.map(a => a.iata).filter(Boolean));
    const usedIcao = new Set(data.map(a => String(a.icao)).filter(Boolean));

    const log = {
        iataFilled: [] as string[],
        added: [] as string[],
        iataConflicts: [] as string[],
        cityFilled: 0,
        cityCodeFilled: 0,
    };

    // 1 + 2: enrich existing records
    for (const airport of data) {
        const near = (row: OARow | undefined) =>
            row && haversine(airport.latitude, airport.longitude, Number(row.latitude_deg), Number(row.longitude_deg)) <= MAX_MATCH_DISTANCE_KM
                ? row
                : undefined;
        const oa = near(airport.icao ? oaByCode.get(String(airport.icao)) : undefined) || near(airport.iata ? oaByIata.get(airport.iata) : undefined);

        const city = CITY_OVERRIDES[String(airport.icao)] ?? (oa?.municipality?.trim() || '');
        if (city !== (airport.city ?? '')) log.cityFilled++;
        airport.city = city;

        if (!oa) {
            setCityCode(airport);
            continue;
        }

        const oaIata = oa.iata_code;
        if (!airport.iata && oaIata && !usedIata.has(oaIata) && airport.icao && icaoFor(oa) === airport.icao) {
            airport.iata = oaIata;
            usedIata.add(oaIata);
            Object.assign(airport, trackingUrls(oaIata, String(airport.icao)));
            if (airport.elevation_ft === null) airport.elevation_ft = num(oa.elevation_ft);
            if (!airport.wikipedia) airport.wikipedia = oa.wikipedia_link || '';
            if (!airport.website) airport.website = oa.home_link || '';
            log.iataFilled.push(`${oaIata} → ${airport.icao} (${airport.airport})`);
        } else if (airport.iata && oaIata && airport.iata !== oaIata && airport.icao && icaoFor(oa) === airport.icao
            && ACKNOWLEDGED_IATA_MISMATCHES[String(airport.icao)] !== airport.iata) {
            log.iataConflicts.push(`${airport.icao} (${airport.airport}): dataset ${airport.iata}, OurAirports ${oaIata}`);
        }

        setCityCode(airport);
    }

    function setCityCode(airport: AirportRecord): void {
        // data_source/ is not in git; without the city-code source (e.g. in CI) keep existing values.
        if (seatsaero.length === 0) {
            airport.city_code = CITY_CODE_OVERRIDES[airport.iata] ?? airport.city_code ?? '';
            return;
        }
        const code = cityCodeFor(airport.iata, airport.latitude, airport.longitude);
        if (code !== (airport.city_code ?? '')) log.cityCodeFilled++;
        airport.city_code = code;
    }

    // 3: add airports missing from the dataset
    for (const [iata, row] of oaByIata) {
        if (usedIata.has(iata) || !/^[A-Z]{3}$/.test(iata)) continue;
        const explicit = EXTRA_ADDS.has(iata);
        const auto = row.scheduled_service === 'yes' && TYPES_ALLOWED_FOR_AUTO_ADD.has(row.type);
        if (!explicit && !auto) continue;

        const icao = icaoFor(row);
        if (icao && usedIcao.has(icao)) continue; // handled by the IATA fill above
        const lat = Number(row.latitude_deg);
        const lon = Number(row.longitude_deg);
        const time = guessTimeZone(data, row.iso_country, lat, lon);
        if (!time) {
            console.warn(`⚠️  Skipping ${iata}: no timezone could be inferred`);
            continue;
        }

        const record: AirportRecord = {
            iata,
            icao,
            time,
            utc: utcOffsetHours(time, UTC_SNAPSHOT_DATE),
            country_code: row.iso_country,
            continent: row.continent,
            airport: cleanName(row.name),
            latitude: lat,
            longitude: lon,
            elevation_ft: num(row.elevation_ft),
            type: row.type,
            scheduled_service: row.scheduled_service === 'yes' ? 'TRUE' : 'FALSE',
            wikipedia: row.wikipedia_link || '',
            website: row.home_link || '',
            runway_length: longestRunway.get(row.ident) ?? null,
            ...trackingUrls(iata, icao),
            city: row.municipality || '',
            city_code: seatsaero.length > 0 ? cityCodeFor(iata, lat, lon) : (CITY_CODE_OVERRIDES[iata] ?? ''),
        };
        data.push(record);
        usedIata.add(iata);
        if (icao) usedIcao.add(icao);
        log.added.push(`${iata} ${icao || '----'} ${record.airport} (${record.country_code})${explicit ? '' : ' [scheduled]'}`);
    }

    for (const code of EXTRA_ADDS) {
        if (!usedIata.has(code)) console.warn(`⚠️  --add ${code}: not found in OurAirports or could not be added`);
    }

    // Report
    const lines: string[] = [];
    lines.push(`## OurAirports refresh`, '');
    lines.push(`- Records: ${data.length}`);
    lines.push(`- city changed: ${log.cityFilled}, city_code changed: ${log.cityCodeFilled}`);
    lines.push('', `### Added (${log.added.length})`, ...log.added.map(s => `- ${s}`));
    lines.push('', `### IATA set on existing records (${log.iataFilled.length})`, ...log.iataFilled.map(s => `- ${s}`));
    lines.push('', `### IATA mismatches to review (${log.iataConflicts.length})`, ...log.iataConflicts.map(s => `- ${s}`));
    const report = lines.join('\n');
    console.log(report);
    if (SUMMARY_PATH) fs.writeFileSync(SUMMARY_PATH, report + '\n');

    if (WRITE) {
        fs.writeFileSync(AIRPORTS_JSON, toAsciiJson(data) + '\n');
        console.log(`\n✅ Wrote ${AIRPORTS_JSON}`);
    } else {
        console.log('\n(dry run; pass --write to save)');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
