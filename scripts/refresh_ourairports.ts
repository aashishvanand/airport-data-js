/**
 * Refreshes data/airports.json against the latest OurAirports export.
 *
 * What it does:
 *   1. Fills `city` (OurAirports `municipality`) and `city_code` (IATA metro/city
 *      code from data_source/seatsaero_new.json) on every record.
 *   2. Sets the IATA code on existing records whose IATA is empty when OurAirports
 *      has one for the same ICAO and the code is not already used.
 *   3. Adds airports whose IATA code is missing from the dataset when they have
 *      scheduled service (or are listed explicitly with --add). With --no-auto-add,
 *      only the --add codes are added; the rest are listed as candidates to review.
 *   4. Sets `continent` from the country and, for transcontinental countries, the
 *      location (scripts/continent.ts).
 *   5. Reports, without changing, IATA codes that differ between the dataset and
 *      OurAirports so a human can review them.
 *
 * Usage:
 *   npx tsx scripts/refresh_ourairports.ts [--csv path] [--runways path]
 *       [--add FSH,BZJ] [--no-auto-add] [--write] [--summary path] [--json path]
 *
 * Without --write the script only prints the diff (dry run).
 * --summary writes a Markdown summary and --json the counts (used by the weekly
 * refresh workflow, which opens an issue from a dry run so new airports can be
 * reviewed before they are added).
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import type { Airport } from '../src/index';
import { continentFor, dominantContinents } from './continent';

const OURAIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const RUNWAYS_URL = 'https://davidmegginson.github.io/ourairports-data/runways.csv';

const ROOT = path.join(__dirname, '..');
const AIRPORTS_JSON = path.join(ROOT, 'data/airports.json');
const SEATSAERO_JSON = path.join(ROOT, 'data_source/seatsaero_new.json');

/** IATA metro assignments that the city-code source is missing (keyed by airport IATA). */
const CITY_CODE_OVERRIDES: Record<string, string> = {
    ALY: 'ALY', // Borg El Arab took over ALY in 2025-2026; the source still lists it as HBE
    EWR: 'NYC',
    JPN: 'WAS', // Pentagon; the source lists OCW (Washington, NC)
    LNQ: 'LNQ', // coordinates corrected; the source still has the old position
    MPT: 'MPT', // coordinates corrected; the source still has the old position
};

/** City names where the OurAirports municipality is misleading (keyed by ICAO). */
const CITY_OVERRIDES: Record<string, string> = {
    KTKI: 'McKinney', // OurAirports lists "Dallas"
    FMNH: 'Antalaha', // Antsirabato Airport; OurAirports lists "Antsirabe", 500+ km away
};

/**
 * IATA mismatches that were reviewed and intentionally kept (keyed by ICAO).
 * They are left out of the "to review" list.
 */
const ACKNOWLEDGED_IATA_MISMATCHES: Record<string, string> = {
    // Borg El Arab was renamed Alexandria International Airport; its codes moved to ALY/HEAX
    // (effective 2025-2026). OurAirports may still list the old HBE IATA code.
    HEAX: 'ALY',
};

/** A source record only counts as the same airport if it is within this distance. */
const MAX_MATCH_DISTANCE_KM = 50;

/** The legacy `utc` field is a July snapshot; new records follow the same convention. */
const UTC_SNAPSHOT_DATE = new Date(Date.UTC(2024, 6, 15, 12));

const TYPES_ALLOWED_FOR_AUTO_ADD = new Set(['large_airport', 'medium_airport', 'small_airport']);
const VALID_TYPES = new Set([...TYPES_ALLOWED_FOR_AUTO_ADD, 'heliport', 'seaplane_base', 'closed']);
const HTTP_URL_RE = /^https?:\/\/\S+$/i;

/** Sanity floor for the OurAirports export; refuses a truncated or error-page download. */
const MIN_OURAIRPORTS_ROWS = 60_000;
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_ATTEMPTS = 3;

function isAutoAddEligible(row: OARow): boolean {
    return row.scheduled_service === 'yes' && TYPES_ALLOWED_FOR_AUTO_ADD.has(row.type);
}

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
const JSON_PATH = argValue('--json');
const AUTO_ADD = !process.argv.includes('--no-auto-add');

async function loadText(localPath: string | undefined, url: string): Promise<string> {
    if (localPath) return fs.readFileSync(localPath, 'utf8');
    let lastError: unknown;
    for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
            if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
            return await res.text();
        } catch (err) {
            lastError = err;
            if (attempt < FETCH_ATTEMPTS) {
                console.warn(`⚠️  Download failed (attempt ${attempt}/${FETCH_ATTEMPTS}): ${err instanceof Error ? err.message : String(err)}`);
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            }
        }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
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

/** Numeric coordinate inside its valid range; blank or out-of-range cells return null. */
function coordinate(value: string | undefined, min: number, max: number): number | null {
    if (value === undefined || value.trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Empty string unless the remote value is a usable http(s) URL. */
function httpUrl(value: string | undefined): string {
    const url = (value || '').trim();
    return HTTP_URL_RE.test(url) ? url : '';
}

/** Municipality without surrounding whitespace or stray trailing commas ("Zephyr," -> "Zephyr"). */
function cleanCity(value: string | undefined): string {
    return (value || '').trim().replace(/[\s,]+$/, '');
}

/** ISO 3166-1 alpha-2, or empty string. */
function countryCode(value: string | undefined): string {
    return /^[A-Z]{2}$/.test(value ?? '') ? value! : '';
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
    if (oaRows.length < MIN_OURAIRPORTS_ROWS) {
        throw new Error(`Refusing to continue: OurAirports returned ${oaRows.length} rows (expected at least ${MIN_OURAIRPORTS_ROWS}); the export is probably truncated`);
    }
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
        // IATA codes can repeat; prefer a row that is eligible for auto-add over one that is not.
        const current = row.iata_code ? oaByIata.get(row.iata_code) : undefined;
        if (row.iata_code && (!current || (!isAutoAddEligible(current) && isAutoAddEligible(row)))) {
            oaByIata.set(row.iata_code, row);
        }
    }

    const usedIata = new Set(data.map(a => a.iata).filter(Boolean));
    const usedIcao = new Set(data.map(a => String(a.icao)).filter(Boolean));

    const log = {
        iataFilled: [] as string[],
        added: [] as string[],
        iataConflicts: [] as string[],
        candidates: [] as string[],
        continentChanged: [] as string[],
        cityFilled: 0,
        cityCodeFilled: 0,
    };

    // 1 + 2: enrich existing records
    for (const airport of data) {
        const near = (row: OARow | undefined) => {
            if (!row) return undefined;
            const lat = coordinate(row.latitude_deg, -90, 90);
            const lon = coordinate(row.longitude_deg, -180, 180);
            return lat !== null && lon !== null && haversine(airport.latitude, airport.longitude, lat, lon) <= MAX_MATCH_DISTANCE_KM
                ? row
                : undefined;
        };
        const oa = near(airport.icao ? oaByCode.get(String(airport.icao)) : undefined) || near(airport.iata ? oaByIata.get(airport.iata) : undefined);

        // Keep the existing city when OurAirports has no replacement, or when its value is
        // the same city with a region appended ("Balivanich" -> "Balivanich, Eilean Siar"),
        // which would break exact city lookups.
        const remoteCity = cleanCity(oa?.municipality);
        const existingCity = airport.city || '';
        const keepExisting = !remoteCity || (existingCity !== '' && remoteCity.toLowerCase().startsWith(`${existingCity.toLowerCase()},`));
        const city = CITY_OVERRIDES[String(airport.icao)] ?? (keepExisting ? existingCity : remoteCity);
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
            if (!airport.wikipedia) airport.wikipedia = httpUrl(oa.wikipedia_link);
            if (!airport.website) airport.website = httpUrl(oa.home_link);
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

    // 4: continent from country and geography (see scripts/continent.ts); records added in 3 use the same rule
    const dominant = dominantContinents(oaRows);
    for (const airport of data) {
        const continent = continentFor(airport.country_code, airport.latitude, airport.longitude, dominant);
        if (continent && continent !== airport.continent) {
            log.continentChanged.push(`${airport.iata || airport.icao} (${airport.airport}, ${airport.country_code}): ${airport.continent} → ${continent}`);
            airport.continent = continent;
        }
    }

    // 3: add airports missing from the dataset
    for (const [iata, row] of oaByIata) {
        if (usedIata.has(iata) || !/^[A-Z]{3}$/.test(iata)) continue;
        const explicit = EXTRA_ADDS.has(iata);
        const auto = isAutoAddEligible(row);
        if (!explicit && !auto) continue;

        const icao = icaoFor(row);
        if (icao && usedIcao.has(icao)) continue; // handled by the IATA fill above
        if (!explicit && !AUTO_ADD) {
            log.candidates.push(`${iata} ${icao || '----'} ${cleanName(row.name)} (${row.iso_country}, ${row.type}) — https://ourairports.com/airports/${row.ident}/`);
            continue;
        }
        const lat = coordinate(row.latitude_deg, -90, 90);
        const lon = coordinate(row.longitude_deg, -180, 180);
        if (lat === null || lon === null) {
            console.warn(`⚠️  Skipping ${iata}: invalid coordinates (${row.latitude_deg}, ${row.longitude_deg})`);
            continue;
        }
        const country = countryCode(row.iso_country);
        if (!country) {
            console.warn(`⚠️  Skipping ${iata}: invalid country code "${row.iso_country}"`);
            continue;
        }
        if (!VALID_TYPES.has(row.type)) {
            console.warn(`⚠️  Skipping ${iata}: invalid airport type "${row.type}"`);
            continue;
        }
        const time = guessTimeZone(data, country, lat, lon);
        if (!time) {
            console.warn(`⚠️  Skipping ${iata}: no timezone could be inferred`);
            continue;
        }

        const record: AirportRecord = {
            iata,
            icao,
            time,
            utc: utcOffsetHours(time, UTC_SNAPSHOT_DATE),
            country_code: country,
            continent: continentFor(country, lat, lon, dominant) ?? row.continent,
            airport: cleanName(row.name),
            latitude: lat,
            longitude: lon,
            elevation_ft: num(row.elevation_ft),
            type: row.type,
            scheduled_service: row.scheduled_service === 'yes' ? 'TRUE' : 'FALSE',
            wikipedia: httpUrl(row.wikipedia_link),
            website: httpUrl(row.home_link),
            runway_length: longestRunway.get(row.ident) ?? null,
            ...trackingUrls(iata, icao),
            city: cleanCity(row.municipality),
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
    lines.push('', `### ${WRITE ? 'Added' : 'To add'} (${log.added.length})`, ...log.added.map(s => `- ${s}`));
    if (!AUTO_ADD) {
        lines.push('', `### New scheduled-service airports to review (${log.candidates.length})`, ...log.candidates.map(s => `- ${s}`));
    }
    lines.push('', `### IATA set on existing records (${log.iataFilled.length})`, ...log.iataFilled.map(s => `- ${s}`));
    lines.push('', `### Continent changed (${log.continentChanged.length})`, ...log.continentChanged.map(s => `- ${s}`));
    lines.push('', `### IATA mismatches to review (${log.iataConflicts.length})`, ...log.iataConflicts.map(s => `- ${s}`));
    const report = lines.join('\n');
    console.log(report);
    if (SUMMARY_PATH) fs.writeFileSync(SUMMARY_PATH, report + '\n');
    if (JSON_PATH) {
        fs.writeFileSync(JSON_PATH, JSON.stringify({
            added: log.added.length,
            candidates: log.candidates.length,
            iataFilled: log.iataFilled.length,
            continentChanged: log.continentChanged.length,
            iataConflicts: log.iataConflicts.length,
            cityChanged: log.cityFilled,
            cityCodeChanged: log.cityCodeFilled,
        }) + '\n');
    }

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
