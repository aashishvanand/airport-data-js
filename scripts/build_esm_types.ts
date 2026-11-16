/**
 * Creates `.d.mts` copies of the generated declaration files for the ESM (`import`)
 * export conditions. Relative specifiers are rewritten to `.mjs` so TypeScript's
 * node16/nodenext resolution finds the matching `.d.mts` file.
 * Run after `build:types`.
 * Usage: npx tsx scripts/build_esm_types.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const typesDir = path.join(__dirname, '../types');
let count = 0;

for (const file of fs.readdirSync(typesDir)) {
    if (!file.endsWith('.d.ts')) continue;
    const source = fs.readFileSync(path.join(typesDir, file), 'utf8');
    const rewritten = source.replace(
        /(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+?)(?:\.js)?\2/g,
        (_m, prefix: string, quote: string, spec: string) => `${prefix}${quote}${spec}.mjs${quote}`
    );
    fs.writeFileSync(path.join(typesDir, file.replace(/\.d\.ts$/, '.d.mts')), rewritten);
    count++;
}

console.log(`Wrote ${count} .d.mts declaration files`);
