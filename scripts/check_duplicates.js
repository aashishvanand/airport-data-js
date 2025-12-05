/**
 * Checks for duplicate airport codes in the compressed data.
 * Validates uniqueness of IATA and ICAO codes.
 * Usage: node scripts/check_duplicates.js
 */

const fs = require('fs');
const path = require('path');
const jsonpack = require('jsonpack');

console.log('🔍 Checking for duplicate airport codes...\n');

const compressedFilePath = path.join(__dirname, '../src', 'airports.compressed');
const compressedData = fs.readFileSync(compressedFilePath, 'utf8');
const airportsData = jsonpack.unpack(compressedData);

const iataCounts = {};
const icaoCounts = {};

airportsData.forEach(airport => {
    if (airport.iata) {
        iataCounts[airport.iata] = (iataCounts[airport.iata] || 0) + 1;
    }
    if (airport.icao) {
        icaoCounts[airport.icao] = (icaoCounts[airport.icao] || 0) + 1;
    }
});

const duplicateIata = Object.entries(iataCounts).filter(([code, count]) => count > 1);
const duplicateIcao = Object.entries(icaoCounts).filter(([code, count]) => count > 1);

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
