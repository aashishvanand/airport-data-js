/**
 * Compresses the airport JSON data using gzip.
 * Reads data/airports.json and writes two base64-encoded gzip payloads ({ "gzip": "<base64>" }).
 * The gzipped JSON is columnar ({ "<field>": [values...] }), which compresses ~25% better
 * than an array of objects; src/core.ts rebuilds the row objects on first use.
 *   - src/airports.data.json       full dataset (default entry point)
 *   - src/airports.lite.data.json  lite dataset (airport-data-js/lite): only airports with an
 *                                  IATA code, no URL fields, coordinates rounded to 4 decimals
 * These files are bundled with the library and decompressed synchronously at runtime via pako.
 * Usage: npx tsx scripts/compress_json.ts
 */

import { gzipSync } from 'node:zlib';
import fs from 'fs-extra';
import path from 'node:path';

/** Fields dropped from the lite dataset. All are optional on the Airport type. */
const LITE_OMITTED_FIELDS = ['wikipedia', 'website', 'flightradar24_url', 'radarbox_url', 'flightaware_url'];

function toColumns(records: Array<Record<string, unknown>>): Record<string, unknown[]> {
    const fields = Object.keys(records[0]);
    for (const record of records) {
        for (const key of Object.keys(record)) if (!fields.includes(key)) fields.push(key);
    }
    return Object.fromEntries(fields.map(field => [field, records.map(r => (field in r ? r[field] : null))]));
}

async function writePayload(records: Array<Record<string, unknown>>, outputPath: string): Promise<void> {
    const gzipped = gzipSync(Buffer.from(JSON.stringify(toColumns(records))), { level: 9 });
    await fs.writeJson(outputPath, { gzip: gzipped.toString('base64') });
    console.log(`Wrote ${path.relative(process.cwd(), outputPath)} (${(gzipped.length * 4 / 3 / 1024).toFixed(0)} KB base64)`);
}

async function compressJSON(): Promise<void> {
    const inputPath = path.join(__dirname, '../data/airports.json');
    const records = (await fs.readJson(inputPath)) as Array<Record<string, unknown>>;

    await writePayload(records, path.join(__dirname, '../src/airports.data.json'));

    const round4 = (v: unknown) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
    const lite = records
        .filter(record => record.iata)
        .map(record => {
            const copy: Record<string, unknown> = { ...record, latitude: round4(record.latitude), longitude: round4(record.longitude) };
            for (const field of LITE_OMITTED_FIELDS) delete copy[field];
            return copy;
        });
    await writePayload(lite, path.join(__dirname, '../src/airports.lite.data.json'));

    console.log('Compression complete.');
}

compressJSON().catch(err => {
    console.error('Error during compression:', err);
    process.exit(1);
});
