/**
 * Converts the raw CSV airport data to JSON format.
 * Reads data/airports.csv and writes data/airports.json.
 * This JSON file is then used by the compression script.
 * Usage: node scripts/csv_to_json.js
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

const csvFilePath = path.join(__dirname, '../data/airports.csv');
const jsonFilePath = path.join(__dirname, '../data/airports.json');

try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        cast: true
    });

    fs.writeFileSync(jsonFilePath, JSON.stringify(records, null, 2));
    console.log(`Successfully converted ${csvFilePath} to ${jsonFilePath}`);
} catch (error) {
    console.error('Error converting CSV to JSON:', error);
    process.exit(1);
}
