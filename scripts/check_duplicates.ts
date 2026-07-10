/**
 * Checks for duplicate airport codes in the compressed data.
 * Validates uniqueness of IATA and ICAO codes.
 * Usage: npx tsx scripts/check_duplicates.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { Airport } from '../src/index';

console.log('🔍 Checking for duplicate airport codes...\n');

const dataFilePath = path.join(__dirname, '../src', 'airports.data.json');
const { gzip } = JSON.parse(fs.readFileSync(dataFilePath, 'utf8')) as { gzip: string };
const airportsData = JSON.parse(gunzipSync(Buffer.from(gzip, 'base64')).toString('utf8')) as Airport[];

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

let hasErrors = false;

console.log(`📊 IATA Codes: ${Object.keys(iataCounts).length} unique codes checked`);
if (duplicateIata.length > 0) {
    console.error(`❌ Found ${duplicateIata.length} duplicate IATA codes:`);
    duplicateIata.slice(0, 10).forEach(([code, count]) => {
        console.error(`   - ${code}: appears ${count} times`);
    });
    if (duplicateIata.length > 10) {
        console.error(`   ... and ${duplicateIata.length - 10} more`);
    }
    hasErrors = true;
} else {
    console.log('✅ No duplicate IATA codes found');
}

console.log(`\n📊 ICAO Codes: ${Object.keys(icaoCounts).length} unique codes checked`);
if (duplicateIcao.length > 0) {
    console.error(`❌ Found ${duplicateIcao.length} duplicate ICAO codes:`);
    duplicateIcao.slice(0, 10).forEach(([code, count]) => {
        console.error(`   - ${code}: appears ${count} times`);
    });
    if (duplicateIcao.length > 10) {
        console.error(`   ... and ${duplicateIcao.length - 10} more`);
    }
    hasErrors = true;
} else {
    console.log('✅ No duplicate ICAO codes found');
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.error('❌ VALIDATION FAILED: Duplicate airport codes detected!');
    console.error('Please fix the duplicates before proceeding.\n');
    process.exit(1);
} else {
    console.log('✅ VALIDATION PASSED: No duplicate codes found!\n');
    process.exit(0);
}
