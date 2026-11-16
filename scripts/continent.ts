/**
 * Continent assignment for airport records.
 *
 * Each country gets one continent (its dominant continent in OurAirports), except
 * countries that span two continents, which are split along geographic boundaries.
 * OurAirports' per-airport continent is not used directly because it is inconsistent
 * (e.g. Vladivostok-area airports tagged EU, Rhodes and Kos tagged AS).
 */

/** Most common continent per country among the given rows (closed airports ignored). */
export function dominantContinents(rows: Array<{ iso_country: string; continent: string; type: string }>): Map<string, string> {
    const counts = new Map<string, Map<string, number>>();
    for (const row of rows) {
        if (row.type === 'closed' || !row.iso_country || !row.continent) continue;
        const byContinent = counts.get(row.iso_country) ?? new Map<string, number>();
        byContinent.set(row.continent, (byContinent.get(row.continent) ?? 0) + 1);
        counts.set(row.iso_country, byContinent);
    }
    const result = new Map<string, string>();
    for (const [country, byContinent] of counts) {
        result.set(country, [...byContinent].sort((a, b) => b[1] - a[1])[0][0]);
    }
    return result;
}

/** Sinai: east of the Suez Canal and the Gulf of Suez. */
function isSinai(lat: number, lon: number): boolean {
    if (lat < 27.7) return false;
    const boundary = lat >= 29.95 ? 32.35 : 32.55 + (29.95 - lat) * 0.568;
    return lon > boundary;
}

/** European Turkey (East Thrace): west of the Bosphorus and north of the Sea of Marmara. */
function isEastThrace(lat: number, lon: number): boolean {
    return lon < 29.03 && lat > 40.75;
}

/** Canary Islands, Ceuta and Melilla. */
function isSpanishAfrica(lat: number, lon: number): boolean {
    return (lat < 30 && lon < -13) || (lat < 35.95 && lon > -5.5 && lon < -2.5);
}

function isHawaii(lat: number, lon: number): boolean {
    return lat > 18 && lat < 29 && lon > -179 && lon < -154;
}

/**
 * Returns the continent code for an airport, or undefined when the country is unknown
 * (callers keep the existing value in that case).
 */
export function continentFor(country: string, lat: number, lon: number, dominant: Map<string, string>): string | undefined {
    if (lat < -60) return 'AN';
    switch (country) {
        case 'US': return isHawaii(lat, lon) ? 'OC' : 'NA';
        case 'RU': return lon >= 60 || lon < 0 ? 'AS' : 'EU'; // Urals; Chukotka crosses 180°
        case 'TR': return isEastThrace(lat, lon) ? 'EU' : 'AS';
        case 'EG': return isSinai(lat, lon) ? 'AS' : 'AF';
        case 'ES': return isSpanishAfrica(lat, lon) ? 'AF' : 'EU';
        case 'CO': return lat > 12 && lon < -80 ? 'NA' : 'SA'; // San Andrés and Providencia
        case 'GR': return 'EU';
        case 'ID': return 'AS';
        case 'PA': return 'NA';
        case 'VE': return 'SA';
    }
    return dominant.get(country);
}
