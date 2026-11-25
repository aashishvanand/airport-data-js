/**
 * Upgrades `http://` links in data/airports.json to `https://` where the host
 * actually serves HTTPS.
 *
 * Many OurAirports rows still use plain http even though the site supports TLS.
 * This script probes each distinct host once (HEAD, falling back to GET), keeps
 * hosts that complete a TLS handshake, and rewrites all links on those hosts.
 * Hosts that redirect back to http, fail TLS, or are unreachable are left alone.
 *
 * Usage:
 *   npx tsx scripts/upgrade_https.ts           # report only
 *   npx tsx scripts/upgrade_https.ts --write   # rewrite data/airports.json
 *
 * Run `npm run generate:compressed` afterwards to refresh the bundled payloads.
 * This is a manual data-maintenance step; it needs network access.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const DATA_PATH = path.join(__dirname, '../data/airports.json');
const LINK_FIELDS = ['website', 'wikipedia'] as const;
const CONCURRENCY = 10;
const TIMEOUT_MS = 8_000;
const ATTEMPTS = 2;

const agent = new https.Agent({ keepAlive: true, maxSockets: CONCURRENCY });

type AirportRecord = Record<string, unknown>;
type HostResult = { host: string; ok: boolean; reason: string };

function requestStatus(host: string, method: 'HEAD' | 'GET'): Promise<{ status: number; location?: string }> {
    return new Promise((resolve, reject) => {
        const req = https.request(
            { host, port: 443, path: '/', method, timeout: TIMEOUT_MS, agent, headers: { 'User-Agent': 'airport-data-js https-upgrade' } },
            res => {
                const result = { status: res.statusCode ?? 0, location: res.headers.location };
                res.destroy();
                resolve(result);
            },
        );
        req.on('timeout', () => req.destroy(new Error('timeout')));
        req.on('error', reject);
        req.end();
    });
}

async function probeHost(host: string): Promise<HostResult> {
    let lastError = 'unreachable';
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        for (const method of ['HEAD', 'GET'] as const) {
            try {
                const { status, location } = await requestStatus(host, method);
                // A redirect back to http means the site does not actually use TLS.
                if (status >= 300 && status < 400 && location && /^http:\/\//i.test(location)) {
                    return { host, ok: false, reason: `redirects to ${location}` };
                }
                return { host, ok: true, reason: `HTTP ${status}` };
            } catch (err) {
                lastError = err instanceof Error ? err.message : String(err);
            }
        }
        if (lastError !== 'timeout' && !/ECONNRESET|EAI_AGAIN|socket hang up/i.test(lastError)) break;
    }
    return { host, ok: false, reason: lastError };
}

function hostOf(url: string): string | null {
    try {
        return new URL(url).host.toLowerCase();
    } catch {
        return null;
    }
}

async function main(): Promise<void> {
    const write = process.argv.includes('--write');
    const records = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as AirportRecord[];

    const candidates = new Map<string, string>();
    for (const record of records) {
        for (const field of LINK_FIELDS) {
            const value = record[field];
            if (typeof value !== 'string' || !value.startsWith('http://')) continue;
            const host = hostOf(value);
            if (host && !candidates.has(host)) candidates.set(host, value);
        }
    }

    const hosts = [...candidates.keys()];
    console.log(`Probing ${hosts.length} hosts for HTTPS support…`);

    const results: HostResult[] = new Array(hosts.length);
    let next = 0;
    async function worker(): Promise<void> {
        while (next < hosts.length) {
            const index = next++;
            results[index] = await probeHost(hosts[index]);
            if ((index + 1) % 100 === 0) console.log(`  ${index + 1}/${hosts.length}`);
        }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, hosts.length) }, worker));

    const upgradable = new Set(results.filter(r => r.ok).map(r => r.host));
    let changed = 0;
    for (const record of records) {
        for (const field of LINK_FIELDS) {
            const value = record[field];
            if (typeof value !== 'string' || !value.startsWith('http://')) continue;
            const host = hostOf(value);
            if (host && upgradable.has(host)) {
                record[field] = 'https://' + value.slice('http://'.length);
                changed++;
            }
        }
    }

    const failed = results.filter(r => !r.ok);
    console.log(`\nHTTPS available: ${upgradable.size}/${hosts.length} hosts (${changed} links upgraded)`);
    if (failed.length > 0) {
        console.log(`Left on http (${failed.length} hosts):`);
        for (const result of failed.slice(0, 20)) console.log(`  ${result.host}: ${result.reason}`);
        if (failed.length > 20) console.log(`  …and ${failed.length - 20} more`);
    }

    if (!write) {
        console.log('\nDry run. Re-run with --write to update data/airports.json.');
        return;
    }
    // Match the refresh script: ASCII-escaped JSON so refreshing the dataset produces minimal diffs.
    const asciiJson = JSON.stringify(records, null, 2).replace(
        /[\u0080-\uffff]/g,
        char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'),
    );
    fs.writeFileSync(DATA_PATH, asciiJson + '\n');
    console.log(`\nWrote ${path.relative(process.cwd(), DATA_PATH)}. Run npm run generate:compressed next.`);
}

main().catch(err => {
    console.error('Error during HTTPS upgrade:', err);
    process.exit(1);
});
