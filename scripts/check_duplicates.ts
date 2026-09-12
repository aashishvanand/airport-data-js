/**
 * Validates the compressed airport dataset.
 * Checks IATA/ICAO code uniqueness plus structural sanity of each record
 * (coordinate ranges, enum fields, scheduled_service format, numeric types).
 * Also reports (non-blocking) how many records are missing optional numeric fields.
 * Usage: npx tsx scripts/check_duplicates.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { Airport } from '../src/index';

console.log('🔍 Validating airport dataset...\n');

const dataFilePath = path.join(__dirname, '../src', 'airports.data.json');
const { gzip } = JSON.parse(fs.readFileSync(dataFilePath, 'utf8')) as { gzip: string };
const airportsData = JSON.parse(gunzipSync(Buffer.from(gzip, 'base64')).toString('utf8')) as Airport[];

const VALID_CONTINENTS = new Set(['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']);
const VALID_TYPES = new Set(['large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base', 'closed']);
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

let hasErrors = false;
const errors: string[] = [];
const addError = (message: string) => {
    errors.push(message);
    hasErrors = true;
};

// --- Uniqueness checks ---

const iataCounts: Record<string, number> = {};
const icaoCounts: Record<string, number> = {};

airportsData.forEach(airport => {
    if (airport.iata) {
        iataCounts[airport.iata] = (iataCounts[airport.iata] || 0) + 1;
    }
    if (airport.icao) {
        icaoCounts[airport.icao] = (icaoCounts[airport.icao] || 0) + 1;
    }
});

const duplicateIata = Object.entries(iataCounts).filter(([, count]) => count > 1);
const duplicateIcao = Object.entries(icaoCounts).filter(([, count]) => count > 1);

console.log(`📊 IATA Codes: ${Object.keys(iataCounts).length} unique codes checked`);
if (duplicateIata.length > 0) {
    addError(`Found ${duplicateIata.length} duplicate IATA codes`);
    duplicateIata.slice(0, 10).forEach(([code, count]) => {
        console.error(`   - ${code}: appears ${count} times`);
    });
    if (duplicateIata.length > 10) console.error(`   ... and ${duplicateIata.length - 10} more`);
} else {
    console.log('✅ No duplicate IATA codes found');
}

console.log(`\n📊 ICAO Codes: ${Object.keys(icaoCounts).length} unique codes checked`);
if (duplicateIcao.length > 0) {
    addError(`Found ${duplicateIcao.length} duplicate ICAO codes`);
    duplicateIcao.slice(0, 10).forEach(([code, count]) => {
        console.error(`   - ${code}: appears ${count} times`);
    });
    if (duplicateIcao.length > 10) console.error(`   ... and ${duplicateIcao.length - 10} more`);
} else {
    console.log('✅ No duplicate ICAO codes found');
}

// --- Structural / field-level checks (hard failures) ---

interface FieldIssue {
    code: string;
    reason: string;
}

const badLatitude: FieldIssue[] = [];
const badLongitude: FieldIssue[] = [];
const badContinent: FieldIssue[] = [];
const badType: FieldIssue[] = [];
const badCountryCode: FieldIssue[] = [];
const badScheduledService: FieldIssue[] = [];
const badUtc: FieldIssue[] = [];

let missingRunwayLength = 0;
let missingElevationFt = 0;
let missingIata = 0;
let missingIcao = 0;

airportsData.forEach(airport => {
    const label = airport.iata || airport.icao || airport.airport || '(unknown)';

    if (typeof airport.latitude !== 'number' || !isFinite(airport.latitude) || airport.latitude < -90 || airport.latitude > 90) {
        badLatitude.push({ code: label, reason: `latitude=${airport.latitude}` });
    }
    if (typeof airport.longitude !== 'number' || !isFinite(airport.longitude) || airport.longitude < -180 || airport.longitude > 180) {
        badLongitude.push({ code: label, reason: `longitude=${airport.longitude}` });
    }
    if (!VALID_CONTINENTS.has(airport.continent)) {
        badContinent.push({ code: label, reason: `continent="${airport.continent}"` });
    }
    if (!VALID_TYPES.has(airport.type)) {
        badType.push({ code: label, reason: `type="${airport.type}"` });
    }
    if (!COUNTRY_CODE_RE.test(airport.country_code)) {
        badCountryCode.push({ code: label, reason: `country_code="${airport.country_code}"` });
    }
    if (airport.scheduled_service !== 'TRUE' && airport.scheduled_service !== 'FALSE') {
        badScheduledService.push({ code: label, reason: `scheduled_service=${JSON.stringify(airport.scheduled_service)}` });
    }
    if (typeof airport.utc !== 'number' || !isFinite(airport.utc)) {
        badUtc.push({ code: label, reason: `utc=${JSON.stringify(airport.utc)}` });
    }

    if (airport.runway_length === null || airport.runway_length === undefined) missingRunwayLength++;
    if (airport.elevation_ft === null || airport.elevation_ft === undefined) missingElevationFt++;
    if (!airport.iata) missingIata++;
    if (!airport.icao) missingIcao++;
});

function reportIssues(title: string, issues: FieldIssue[]): void {
    console.log(`\n📊 ${title}`);
    if (issues.length > 0) {
        addError(`Found ${issues.length} records with invalid ${title.toLowerCase()}`);
        issues.slice(0, 10).forEach(({ code, reason }) => console.error(`   - ${code}: ${reason}`));
        if (issues.length > 10) console.error(`   ... and ${issues.length - 10} more`);
    } else {
        console.log(`✅ All records have valid ${title.toLowerCase()}`);
    }
}

reportIssues('Latitude range (-90..90)', badLatitude);
reportIssues('Longitude range (-180..180)', badLongitude);
reportIssues('Continent code', badContinent);
reportIssues('Airport type', badType);
reportIssues('Country code format', badCountryCode);
reportIssues('scheduled_service value (must be "TRUE" or "FALSE")', badScheduledService);
reportIssues('utc field (must be numeric)', badUtc);

// --- Report-only: known, non-blocking data gaps ---

console.log('\n📋 Data completeness (informational, does not fail validation):');
console.log(`   - Missing IATA code: ${missingIata}`);
console.log(`   - Missing ICAO code: ${missingIcao}`);
console.log(`   - Missing runway_length: ${missingRunwayLength}`);
console.log(`   - Missing elevation_ft: ${missingElevationFt}`);

console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.error('❌ VALIDATION FAILED:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\nPlease fix the issues above before proceeding.\n');
    process.exit(1);
} else {
    console.log('✅ VALIDATION PASSED: dataset is structurally sound!\n');
    process.exit(0);
}
