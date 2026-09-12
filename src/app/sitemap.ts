import type { MetadataRoute } from 'next';
import { findAirports } from 'airport-data-js';

const siteUrl = 'https://airportdata.dev';

// Airport data changes rarely (occasional IATA/ICAO reassignments, new airports) —
// regenerating this on every request would mean scanning ~18,771 records per hit.
export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const allAirports = await findAirports({});

    // Scheduled-service airports only: a smaller, higher-quality set indexes better
    // than submitting ~18,771 pages including small uncontrolled airstrips and
    // heliports with no commercial traffic. Those pages still exist and work if
    // linked to directly — they're just not proactively submitted to search engines.
    const seen = new Set<string>();
    const airportEntries: MetadataRoute.Sitemap = [];

    for (const airport of allAirports) {
        if (airport.scheduled_service !== 'TRUE') continue;
        const code = airport.iata || airport.icao;
        if (!code || seen.has(code)) continue;
        seen.add(code);
        airportEntries.push({
            url: `${siteUrl}/${code}`,
            changeFrequency: 'monthly',
            priority: airport.type === 'large_airport' ? 0.8 : 0.6,
        });
    }

    return [
        {
            url: siteUrl,
            changeFrequency: 'weekly',
            priority: 1,
        },
        ...airportEntries,
    ];
}
