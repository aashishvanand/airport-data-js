/**
 * Compresses the airport JSON data using gzip.
 * Reads data/airports.json and writes src/airports.data.json
 * as a base64-encoded gzip payload: { "gzip": "<base64>" }.
 * This file is what gets bundled with the library and decompressed
 * synchronously at runtime via pako.
 * Usage: npx tsx scripts/compress_json.ts
 */

import { gzipSync } from 'node:zlib';
import fs from 'fs-extra';
import path from 'node:path';

async function compressJSON(): Promise<void> {
    const inputPath = path.join(__dirname, '../data/airports.json');
    const outputPath = path.join(__dirname, '../src/airports.data.json');

    const originalData = await fs.readJson(inputPath);
    const gzipped = gzipSync(Buffer.from(JSON.stringify(originalData)));

    await fs.writeJson(outputPath, { gzip: gzipped.toString('base64') });

    console.log('Compression complete. Compressed data written to airports.data.json');
}

compressJSON().catch(err => {
    console.error('Error during compression:', err);
    process.exit(1);
});
