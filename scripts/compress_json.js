/**
 * Compresses the airport JSON data using jsonpack.
 * Reads data/airports.json and writes src/airports.compressed.
 * This compressed file is what gets bundled with the library.
 * Usage: node scripts/compress_json.js
 */

const jsonpack = require('jsonpack');
const fs = require('fs-extra');
const path = require('path');

async function compressJSON() {
    // Read the original JSON data
    // Using path.join for better cross-platform compatibility, though relative paths work in require too
    const inputPath = path.join(__dirname, '../data/airports.json');
    const outputPath = path.join(__dirname, '../src/airports.compressed');

    const originalData = await fs.readJson(inputPath);

    // Compress the data using jsonpack
    const packedData = jsonpack.pack(originalData);

    // Write the compressed data to a new file
    await fs.writeFile(outputPath, packedData, 'utf8');

    console.log('Compression complete. Compressed data written to airports.compressed');
}

compressJSON().catch(err => {
    console.error('Error during compression:', err);
});
