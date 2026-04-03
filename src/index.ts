import jsonpack from 'jsonpack';
// @ts-ignore - raw-loader import
import compressedData from './airports.compressed';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Represents a single airport record from the database.
 *
 * @example
 * ```typescript
 * const [airport] = await getAirportByIata('SIN');
 * console.log(airport.airport); // "Singapore Changi Airport"
 * console.log(airport.country_code); // "SG"
 * ```
 */
export interface Airport {
    /** 3-letter IATA airport code (e.g., "SIN", "LHR", "JFK") */
    iata: string;
    /** 4-letter ICAO airport code (e.g., "WSSS", "EGLL", "KJFK") */
    icao: string;
    /** IANA timezone identifier (e.g., "Asia/Singapore") */
    time: string;
    /** UTC offset string (e.g., "+08:00") */
    utc: string;
    /** ISO 3166-1 alpha-2 country code (e.g., "SG", "GB", "US") */
    country_code: string;
    /** 2-letter continent code: AF, AN, AS, EU, NA, OC, SA */
    continent: string;
    /** Full airport name (e.g., "Singapore Changi Airport") */
    airport: string;
    /** Latitude in decimal degrees as a string */
    latitude: string;
    /** Longitude in decimal degrees as a string */
    longitude: string;
    /** Elevation above sea level in feet (string) */
    elevation: string;
    /** Elevation in feet (string, same as elevation) */
    elevation_ft: string;
    /** Airport classification: "large_airport" | "medium_airport" | "small_airport" | "heliport" | "seaplane_base" | "closed" */
    type: string;
    /** Whether the airport has scheduled commercial service */
    scheduled_service: boolean | string;
    /** Wikipedia article URL */
    wikipedia?: string;
    /** Airport official website URL */
    website?: string;
    /** Longest runway length in feet (string) */
    runway_length?: string;
    /** FlightRadar24 tracking URL */
    flightradar24_url?: string;
    /** RadarBox tracking URL */
    radarbox_url?: string;
    /** FlightAware tracking URL */
    flightaware_url?: string;
}

/**
 * An airport record with distance from a reference point, returned by proximity search functions.
 *
 * @example
 * ```typescript
 * const nearest = await findNearestAirport(1.35, 103.99);
 * console.log(nearest.distance); // 0.52 (km)
 * ```
 */
export interface AirportWithDistance extends Airport {
    /** Distance from the search point in kilometers */
    distance: number;
}

/**
 * Filter criteria for searching airports. All fields are optional and combined with AND logic.
 *
 * @example
 * ```typescript
 * // Find large airports in the US with scheduled service
 * const airports = await findAirports({
 *     country_code: 'US',
 *     type: 'large_airport',
 *     has_scheduled_service: true
 * });
 * ```
 */
export interface AirportFilters {
    iata?: string;
    icao?: string;
    time?: string;
    utc?: string;
    country_code?: string;
    continent?: string;
    airport?: string;
    latitude?: string;
    longitude?: string;
    elevation_ft?: string;
    elevation?: string;
    type?: string;
    scheduled_service?: boolean | string;
    wikipedia?: string;
    website?: string;
    runway_length?: string;
    flightradar24_url?: string;
    radarbox_url?: string;
    flightaware_url?: string;
    /** Filter by scheduled service availability (true = has scheduled service) */
    has_scheduled_service?: boolean;
    /** Minimum runway length in feet */
    min_runway_ft?: number;
}

/**
 * External links associated with an airport.
 *
 * @example
 * ```typescript
 * const links = await getAirportLinks('LHR');
 * console.log(links.wikipedia); // "https://en.wikipedia.org/wiki/Heathrow_Airport"
 * ```
 */
export interface AirportLinks {
    website?: string;
    wikipedia?: string;
    flightradar24?: string;
    radarbox?: string;
    flightaware?: string;
}

/**
 * Aggregated statistics for airports in a country.
 *
 * @example
 * ```typescript
 * const stats = await getAirportStatsByCountry('US');
 * console.log(stats.total); // 19000+
 * console.log(stats.byType.large_airport); // 180+
 * ```
 */
export interface AirportCountryStats {
    /** Total number of airports */
    total: number;
    /** Count of airports grouped by type */
    byType: Record<string, number>;
    /** Number of airports with scheduled commercial service */
    withScheduledService: number;
    /** Average runway length in feet across airports that have runway data */
    averageRunwayLength: number;
    /** Average elevation in feet */
    averageElevation: number;
    /** List of unique IANA timezones */
    timezones: string[];
}

/**
 * Aggregated statistics for airports on a continent.
 *
 * @example
 * ```typescript
 * const stats = await getAirportStatsByContinent('EU');
 * console.log(stats.byCountry['GB']); // number of UK airports
 * ```
 */
export interface AirportContinentStats extends AirportCountryStats {
    /** Count of airports grouped by country code */
    byCountry: Record<string, number>;
}

/**
 * Result of a distance matrix calculation between multiple airports.
 *
 * @example
 * ```typescript
 * const matrix = await calculateDistanceMatrix(['SIN', 'LHR', 'JFK']);
 * console.log(matrix.distances['SIN']['LHR']); // 10846
 * ```
 */
export interface DistanceMatrix {
    /** Summary info for each airport in the matrix */
    airports: Array<{
        code: string;
        name: string;
        iata: string;
        icao: string;
    }>;
    /** Symmetric distance matrix: distances[codeA][codeB] = km (rounded) */
    distances: Record<string, Record<string, number>>;
}

/** Sort criteria for ranking airports */
export type SortBy = 'runway' | 'elevation';

// ============================================================================
// Internal State
// ============================================================================

let airportsData: Airport[] | null = null;
let iataIndex: Map<string, Airport[]> | null = null;
let icaoIndex: Map<string, Airport[]> | null = null;
let countryIndex: Map<string, Airport[]> | null = null;
let continentIndex: Map<string, Airport[]> | null = null;
let timezoneIndex: Map<string, Airport[]> | null = null;
let typeIndex: Map<string, Airport[]> | null = null;

interface GeoEntry {
    lat: number;
    lon: number;
    index: number;
}

let geoData: GeoEntry[] | null = null;

const DEG_TO_RAD: number = Math.PI / 180;
const EARTH_RADIUS_KM: number = 6371;

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Converts degrees to radians.
 * @private
 */
function toRad(deg: number): number {
    return deg * DEG_TO_RAD;
}

/**
 * Computes the Haversine great-circle distance between two points.
 * @private
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Unpacks the compressed airport data into a usable array.
 * Lazy loads the data on first access.
 * @private
 */
function getData(): Airport[] {
    if (!airportsData) {
        airportsData = jsonpack.unpack(compressedData) as Airport[];
    }
    return airportsData;
}

/**
 * Pre-computes geographic data (parsed lat/lon) for all airports.
 * @private
 */
function getGeoData(): GeoEntry[] {
    if (!geoData) {
        const data = getData();
        geoData = [];
        for (let i = 0; i < data.length; i++) {
            const airport = data[i];
            if (airport.latitude && airport.longitude) {
                const lat = parseFloat(airport.latitude);
                const lon = parseFloat(airport.longitude);
                if (isFinite(lat) && isFinite(lon)) {
                    geoData.push({ lat, lon, index: i });
                }
            }
        }
    }
    return geoData;
}

/**
 * Builds and returns an index of airports by IATA code.
 * @private
 */
function getIataIndex(): Map<string, Airport[]> {
    if (!iataIndex) {
        const data = getData();
        iataIndex = new Map();
        data.forEach(airport => {
            if (airport.iata) {
                if (!iataIndex!.has(airport.iata)) {
                    iataIndex!.set(airport.iata, []);
                }
                iataIndex!.get(airport.iata)!.push(airport);
            }
        });
    }
    return iataIndex;
}

/**
 * Builds and returns an index of airports by ICAO code.
 * @private
 */
function getIcaoIndex(): Map<string, Airport[]> {
    if (!icaoIndex) {
        const data = getData();
        icaoIndex = new Map();
        data.forEach(airport => {
            if (airport.icao) {
                if (!icaoIndex!.has(airport.icao)) {
                    icaoIndex!.set(airport.icao, []);
                }
                icaoIndex!.get(airport.icao)!.push(airport);
            }
        });
    }
    return icaoIndex;
}

/**
 * Builds and returns an index of airports by country code.
 * @private
 */
function getCountryIndex(): Map<string, Airport[]> {
    if (!countryIndex) {
        const data = getData();
        countryIndex = new Map();
        data.forEach(airport => {
            if (airport.country_code) {
                if (!countryIndex!.has(airport.country_code)) {
                    countryIndex!.set(airport.country_code, []);
                }
                countryIndex!.get(airport.country_code)!.push(airport);
            }
        });
    }
    return countryIndex;
}

/**
 * Builds and returns an index of airports by continent code.
 * @private
 */
function getContinentIndex(): Map<string, Airport[]> {
    if (!continentIndex) {
        const data = getData();
        continentIndex = new Map();
        data.forEach(airport => {
            if (airport.continent) {
                if (!continentIndex!.has(airport.continent)) {
                    continentIndex!.set(airport.continent, []);
                }
                continentIndex!.get(airport.continent)!.push(airport);
            }
        });
    }
    return continentIndex;
}

/**
 * Builds and returns an index of airports by timezone.
 * @private
 */
function getTimezoneIndex(): Map<string, Airport[]> {
    if (!timezoneIndex) {
        const data = getData();
        timezoneIndex = new Map();
        data.forEach(airport => {
            if (airport.time) {
                if (!timezoneIndex!.has(airport.time)) {
                    timezoneIndex!.set(airport.time, []);
                }
                timezoneIndex!.get(airport.time)!.push(airport);
            }
        });
    }
    return timezoneIndex;
}

/**
 * Builds and returns an index of airports by type.
 * @private
 */
function getTypeIndex(): Map<string, Airport[]> {
    if (!typeIndex) {
        const data = getData();
        typeIndex = new Map();
        data.forEach(airport => {
            if (airport.type) {
                const lowerType = airport.type.toLowerCase();
                if (!typeIndex!.has(lowerType)) {
                    typeIndex!.set(lowerType, []);
                }
                typeIndex!.get(lowerType)!.push(airport);
            }
        });
    }
    return typeIndex;
}

/**
 * Returns a shallow copy of an airport object to prevent mutation of cached data.
 * @private
 */
function copyAirport(airport: Airport): Airport {
    return { ...airport };
}

/**
 * Returns shallow copies of an array of airport objects.
 * @private
 */
function copyAirports(airports: Airport[]): Airport[] {
    return airports.map(a => ({ ...a }));
}

/**
 * Validates a string against a regular expression and throws an error if it doesn't match.
 * @private
 */
function validateRegex(data: string, regex: RegExp, errorMessage: string): void {
    if (!regex.test(data)) {
        throw new Error(errorMessage);
    }
}

/**
 * A helper function to get an airport by either IATA or ICAO code.
 * @private
 */
async function _getAirportByCode(code: string): Promise<Airport | null> {
    if (typeof code !== 'string') return null;

    if (/^[A-Z]{3}$/.test(code)) {
        const index = getIataIndex();
        const results = index.get(code);
        return results && results.length > 0 ? copyAirport(results[0]) : null;
    }

    if (/^[A-Z0-9]{4}$/.test(code)) {
        const index = getIcaoIndex();
        const results = index.get(code);
        return results && results.length > 0 ? copyAirport(results[0]) : null;
    }

    return null;
}

/**
 * A helper function to get an airport by either IATA or ICAO code
 * without defensive copying. For internal use where copies are not needed.
 * @private
 */
function _getAirportByCodeDirect(code: string): Airport | null {
    if (typeof code !== 'string') return null;

    if (/^[A-Z]{3}$/.test(code)) {
        const index = getIataIndex();
        const results = index.get(code);
        return results && results.length > 0 ? results[0] : null;
    }

    if (/^[A-Z0-9]{4}$/.test(code)) {
        const index = getIcaoIndex();
        const results = index.get(code);
        return results && results.length > 0 ? results[0] : null;
    }

    return null;
}

/**
 * Set of allowed filter keys to prevent prototype pollution.
 * @private
 */
const ALLOWED_FILTER_KEYS = new Set<string>([
    'iata', 'icao', 'time', 'utc', 'country_code', 'continent',
    'airport', 'latitude', 'longitude', 'elevation_ft', 'elevation',
    'type', 'scheduled_service', 'wikipedia', 'website',
    'runway_length', 'flightradar24_url', 'radarbox_url', 'flightaware_url',
    'has_scheduled_service', 'min_runway_ft'
]);

/**
 * Internal implementation of findAirports that returns references (no copies).
 * @private
 */
function _findAirportsInternal(filters: AirportFilters = {}): Airport[] {
    const filterKeys = Object.keys(filters);
    for (const key of filterKeys) {
        if (!ALLOWED_FILTER_KEYS.has(key)) {
            throw new Error(`Unrecognized filter key: '${key}'. Allowed keys: ${[...ALLOWED_FILTER_KEYS].join(', ')}`);
        }
    }

    let candidateSet: Airport[] | null = null;

    for (const key of filterKeys) {
        const filterValue = (filters as Record<string, unknown>)[key];
        let indexed: Airport[] | null = null;

        switch (key) {
            case 'country_code':
                indexed = getCountryIndex().get(filterValue as string) || [];
                break;
            case 'continent':
                indexed = getContinentIndex().get(filterValue as string) || [];
                break;
            case 'type': {
                const lowerType = (typeof filterValue === 'string') ? filterValue.toLowerCase() : '';
                indexed = getTypeIndex().get(lowerType) || [];
                break;
            }
            case 'time':
                indexed = getTimezoneIndex().get(filterValue as string) || [];
                break;
            case 'iata':
                indexed = getIataIndex().get(filterValue as string) || [];
                break;
            case 'icao':
                indexed = getIcaoIndex().get(filterValue as string) || [];
                break;
        }

        if (indexed !== null) {
            if (candidateSet === null) {
                candidateSet = indexed;
            } else {
                const refSet = new Set(indexed);
                candidateSet = candidateSet.filter(a => refSet.has(a));
            }
        }
    }

    const airports = candidateSet !== null ? candidateSet : getData();

    const results = airports.filter(airport => {
        for (const key of filterKeys) {
            const filterValue = (filters as Record<string, unknown>)[key];
            switch (key) {
                case 'country_code':
                case 'continent':
                case 'time':
                case 'iata':
                case 'icao':
                    if (candidateSet !== null) break;
                    if (!Object.prototype.hasOwnProperty.call(airport, key) || (airport as unknown as Record<string, unknown>)[key] !== filterValue) return false;
                    break;

                case 'type':
                    if (candidateSet !== null) break;
                    if (!Object.prototype.hasOwnProperty.call(airport, key) || (airport as unknown as Record<string, unknown>)[key] !== filterValue) return false;
                    break;

                case 'has_scheduled_service': {
                    const scheduledService = airport.scheduled_service;
                    const expectedValue = filterValue as boolean;
                    const actualValue: boolean = typeof scheduledService === 'string'
                        ? scheduledService.toLowerCase() === 'yes'
                        : scheduledService === true;
                    if (actualValue !== expectedValue) return false;
                    break;
                }

                case 'min_runway_ft': {
                    const runwayLength = parseInt(airport.runway_length || '0', 10) || 0;
                    if (runwayLength < (filterValue as number)) return false;
                    break;
                }

                default:
                    if (!Object.prototype.hasOwnProperty.call(airport, key) || (airport as unknown as Record<string, unknown>)[key] !== filterValue) return false;
            }
        }
        return true;
    });

    return results;
}

// ============================================================================
// Core Search Functions
// ============================================================================

/**
 * Finds airports by their 3-letter IATA code.
 *
 * @param iataCode - The IATA code of the airport (e.g., 'LHR').
 * @returns Array of matching airport objects.
 * @throws If the IATA code format is invalid or no data is found.
 *
 * @example
 * ```typescript
 * const [airport] = await getAirportByIata('LHR');
 * console.log(airport.airport); // "London Heathrow Airport"
 * console.log(airport.country_code); // "GB"
 * ```
 */
export async function getAirportByIata(iataCode: string = ''): Promise<Airport[]> {
    validateRegex(iataCode, /^[A-Z]{3}$/, "Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'.");
    const index = getIataIndex();
    const results = index.get(iataCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for IATA code: ${iataCode}`);
    }
    return copyAirports(results);
}

/**
 * Finds airports by their 4-character ICAO code.
 *
 * @param icaoCode - The ICAO code of the airport (e.g., 'EGLL').
 * @returns Array of matching airport objects.
 * @throws If the ICAO code format is invalid or no data is found.
 *
 * @example
 * ```typescript
 * const [airport] = await getAirportByIcao('EGLL');
 * console.log(airport.airport); // "London Heathrow Airport"
 * ```
 */
export async function getAirportByIcao(icaoCode: string = ''): Promise<Airport[]> {
    validateRegex(icaoCode, /^[A-Z0-9]{4}$/, "Invalid ICAO format. Please provide a 4-character uppercase code, e.g., 'NTGA'.");
    const index = getIcaoIndex();
    const results = index.get(icaoCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for ICAO code: ${icaoCode}`);
    }
    return copyAirports(results);
}

/**
 * Finds airports by their 2-letter ISO country code.
 * Uses a pre-built index for O(1) lookup.
 *
 * @param countryCode - The ISO 3166-1 alpha-2 country code (e.g., 'US').
 * @returns Array of matching airport objects.
 * @throws If the country code format is invalid or no data is found.
 *
 * @example
 * ```typescript
 * const airports = await getAirportByCountryCode('US');
 * console.log(airports.length); // 19000+
 * ```
 */
export async function getAirportByCountryCode(countryCode: string = ''): Promise<Airport[]> {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    const index = getCountryIndex();
    const results = index.get(countryCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for Country Code: ${countryCode}`);
    }
    return copyAirports(results);
}

/**
 * Finds airports by their 2-letter continent code.
 * Uses a pre-built index for O(1) lookup.
 *
 * Valid continent codes: AF (Africa), AN (Antarctica), AS (Asia),
 * EU (Europe), NA (North America), OC (Oceania), SA (South America).
 *
 * @param continentCode - The continent code (e.g., 'AS' for Asia).
 * @returns Array of matching airport objects.
 * @throws If the continent code format is invalid or no data is found.
 *
 * @example
 * ```typescript
 * const airports = await getAirportByContinent('EU');
 * console.log(airports.every(a => a.continent === 'EU')); // true
 * ```
 */
export async function getAirportByContinent(continentCode: string = ''): Promise<Airport[]> {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const index = getContinentIndex();
    const results = index.get(continentCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for Continent Code: ${continentCode}`);
    }
    return copyAirports(results);
}

/**
 * Searches for airports by name. Case-insensitive partial matching.
 *
 * @param query - The name or partial name to search for (2-100 characters).
 * @returns Array of matching airport objects.
 * @throws If the query is too short or too long.
 *
 * @example
 * ```typescript
 * const airports = await searchByName('Heathrow');
 * console.log(airports[0].iata); // "LHR"
 * ```
 */
export async function searchByName(query: string = ''): Promise<Airport[]> {
    if (typeof query !== 'string' || query.length < 2) {
        throw new Error("Search query must be at least 2 characters long.");
    }
    if (query.length > 100) {
        throw new Error("Search query must not exceed 100 characters.");
    }
    const lowerCaseQuery = query.toLowerCase();
    const results = getData().filter(item =>
        item.airport.toLowerCase().includes(lowerCaseQuery)
    );
    return copyAirports(results);
}

/**
 * Finds airports within a specified radius of a geographic point.
 * Uses a bounding-box pre-filter to skip expensive Haversine calculations for distant airports.
 *
 * @param lat - Latitude of the center point (-90 to 90).
 * @param lon - Longitude of the center point (-180 to 180).
 * @param radiusKm - The search radius in kilometers (default: 100).
 * @returns Array of airports within the radius.
 *
 * @example
 * ```typescript
 * // Find airports within 50km of central London
 * const airports = await findNearbyAirports(51.5074, -0.1278, 50);
 * console.log(airports.some(a => a.iata === 'LHR')); // true
 * ```
 */
export async function findNearbyAirports(lat: number, lon: number, radiusKm: number = 100): Promise<Airport[]> {
    if (typeof lat !== 'number' || !isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error("Invalid latitude. Must be a finite number between -90 and 90.");
    }
    if (typeof lon !== 'number' || !isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error("Invalid longitude. Must be a finite number between -180 and 180.");
    }
    if (typeof radiusKm !== 'number' || !isFinite(radiusKm) || radiusKm <= 0) {
        throw new Error("Invalid radius. Must be a positive finite number in kilometers.");
    }

    const data = getData();
    const geo = getGeoData();

    const latDelta = radiusKm / 111;
    const cosLat = Math.cos(toRad(lat));
    const lonDelta = cosLat > 0.001 ? radiusKm / (111 * cosLat) : 360;

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const results: Airport[] = [];

    for (let i = 0; i < geo.length; i++) {
        const g = geo[i];

        if (g.lat < minLat || g.lat > maxLat) continue;
        if (g.lon < minLon || g.lon > maxLon) continue;

        const distance = haversineDistance(lat, lon, g.lat, g.lon);
        if (distance <= radiusKm) {
            results.push(data[g.index]);
        }
    }

    return copyAirports(results);
}

/**
 * Finds airports by their type classification.
 * Uses a pre-built index for O(1) lookup on exact matches.
 *
 * Valid types: "large_airport", "medium_airport", "small_airport", "heliport",
 * "seaplane_base", "closed". Pass "airport" to match all airport types.
 *
 * @param type - The type of airport to filter by (case-insensitive).
 * @returns Array of matching airport objects.
 * @throws If the type is not a non-empty string.
 *
 * @example
 * ```typescript
 * const largeAirports = await getAirportsByType('large_airport');
 * console.log(largeAirports.length); // 300+
 * ```
 */
export async function getAirportsByType(type: string = ''): Promise<Airport[]> {
    if (typeof type !== 'string' || type.length === 0) {
        throw new Error("Invalid type provided.");
    }
    const lowerCaseType = type.toLowerCase();
    const index = getTypeIndex();

    const exactResults = index.get(lowerCaseType);
    if (exactResults) {
        return copyAirports(exactResults);
    }

    if (lowerCaseType === 'airport') {
        const results: Airport[] = [];
        for (const [key, airports] of index) {
            if (key.includes('airport')) {
                results.push(...airports);
            }
        }
        return copyAirports(results);
    }

    return [];
}

/**
 * Calculates the great-circle distance between two airports using the Haversine formula.
 *
 * @param code1 - The IATA or ICAO code of the first airport.
 * @param code2 - The IATA or ICAO code of the second airport.
 * @returns The distance in kilometers, or null if an airport is not found.
 *
 * @example
 * ```typescript
 * const km = await calculateDistance('LHR', 'JFK');
 * console.log(Math.round(km!)); // 5541
 * ```
 */
export async function calculateDistance(code1: string, code2: string): Promise<number | null> {
    const airport1 = _getAirportByCodeDirect(code1);
    const airport2 = _getAirportByCodeDirect(code2);

    if (!airport1 || !airport2) {
        return null;
    }

    const lat1 = parseFloat(airport1.latitude);
    const lon1 = parseFloat(airport1.longitude);
    const lat2 = parseFloat(airport2.latitude);
    const lon2 = parseFloat(airport2.longitude);

    return haversineDistance(lat1, lon1, lat2, lon2);
}

/**
 * Provides autocomplete suggestions based on a partial query.
 * Searches by airport name and IATA code. Returns up to 10 results.
 *
 * @param query - The partial query string (2-100 characters).
 * @returns Array of up to 10 matching airports.
 *
 * @example
 * ```typescript
 * const suggestions = await getAutocompleteSuggestions('Lon');
 * // Returns airports matching "Lon" (London Heathrow, London Gatwick, etc.)
 * ```
 */
export async function getAutocompleteSuggestions(query: string = ''): Promise<Airport[]> {
    if (typeof query !== 'string' || query.length < 2 || query.length > 100) {
        return [];
    }
    const lowerCaseQuery = query.toLowerCase();

    const data = getData();
    const results: Airport[] = [];
    for (let i = 0; i < data.length && results.length < 10; i++) {
        const item = data[i];
        if (item.airport.toLowerCase().includes(lowerCaseQuery) ||
            item.iata.toLowerCase().includes(lowerCaseQuery)) {
            results.push(copyAirport(item));
        }
    }

    return results;
}

/**
 * Finds airports that match multiple filter criteria (combined with AND logic).
 * Uses indexed lookups where possible for performance.
 *
 * @param filters - An object of filter criteria to apply.
 * @returns Array of matching airports.
 * @throws If an unrecognized filter key is provided.
 *
 * @example
 * ```typescript
 * const airports = await findAirports({
 *     country_code: 'GB',
 *     type: 'large_airport',
 *     has_scheduled_service: true
 * });
 * ```
 */
export async function findAirports(filters: AirportFilters = {}): Promise<Airport[]> {
    return copyAirports(_findAirportsInternal(filters));
}

/**
 * Finds all airports within a specific IANA timezone.
 * Uses a pre-built index for O(1) lookup.
 *
 * @param timezone - The IANA timezone identifier (e.g., 'Europe/London', 'Asia/Singapore').
 * @returns Array of matching airports.
 * @throws If the timezone string is empty.
 *
 * @example
 * ```typescript
 * const airports = await getAirportsByTimezone('Europe/London');
 * console.log(airports.every(a => a.time === 'Europe/London')); // true
 * ```
 */
export async function getAirportsByTimezone(timezone: string = ''): Promise<Airport[]> {
    if (!timezone) throw new Error("Timezone cannot be empty.");
    const index = getTimezoneIndex();
    const results = index.get(timezone) || [];
    return copyAirports(results);
}

/**
 * Gets a map of external links (Wikipedia, FlightRadar24, etc.) for an airport.
 *
 * @param code - The IATA or ICAO code of the airport.
 * @returns An object of links, or null if the airport is not found.
 *
 * @example
 * ```typescript
 * const links = await getAirportLinks('LHR');
 * console.log(links?.wikipedia); // "https://en.wikipedia.org/wiki/Heathrow_Airport"
 * ```
 */
export async function getAirportLinks(code: string): Promise<AirportLinks | null> {
    const airport = _getAirportByCodeDirect(code);
    if (!airport) {
        return null;
    }
    return {
        website: airport.website,
        wikipedia: airport.wikipedia,
        flightradar24: airport.flightradar24_url,
        radarbox: airport.radarbox_url,
        flightaware: airport.flightaware_url,
    };
}

// ============================================================================
// Statistical & Analytical Functions
// ============================================================================

/**
 * Gets comprehensive statistics about airports in a specific country.
 * Includes counts by type, average runway length, average elevation, and timezones.
 *
 * @param countryCode - The 2-letter ISO country code (e.g., 'US').
 * @returns Aggregated statistics object.
 * @throws If the country code format is invalid or no airports are found.
 *
 * @example
 * ```typescript
 * const stats = await getAirportStatsByCountry('US');
 * console.log(stats.total);                  // 19000+
 * console.log(stats.byType.large_airport);   // 180+
 * console.log(stats.withScheduledService);   // number
 * ```
 */
export async function getAirportStatsByCountry(countryCode: string = ''): Promise<AirportCountryStats> {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    const index = getCountryIndex();
    const airports = index.get(countryCode) || [];

    if (airports.length === 0) {
        throw new Error(`No airports found for Country Code: ${countryCode}`);
    }

    const timezonesSet = new Set<string>();
    const stats: AirportCountryStats = {
        total: airports.length,
        byType: {},
        withScheduledService: 0,
        averageRunwayLength: 0,
        averageElevation: 0,
        timezones: []
    };

    let totalRunwayLength = 0;
    let runwayCount = 0;
    let totalElevation = 0;
    let elevationCount = 0;

    airports.forEach(airport => {
        const type = airport.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        if (airport.scheduled_service === true || airport.scheduled_service === 'yes') {
            stats.withScheduledService++;
        }

        const runwayLength = parseInt(airport.runway_length || '0', 10);
        if (!isNaN(runwayLength) && runwayLength > 0) {
            totalRunwayLength += runwayLength;
            runwayCount++;
        }

        const elevation = parseInt(airport.elevation, 10);
        if (!isNaN(elevation)) {
            totalElevation += elevation;
            elevationCount++;
        }

        if (airport.time) {
            timezonesSet.add(airport.time);
        }
    });

    stats.averageRunwayLength = runwayCount > 0 ? Math.round(totalRunwayLength / runwayCount) : 0;
    stats.averageElevation = elevationCount > 0 ? Math.round(totalElevation / elevationCount) : 0;
    stats.timezones = Array.from(timezonesSet);

    return stats;
}

/**
 * Gets comprehensive statistics about airports on a specific continent.
 * Includes counts by type, by country, average runway length, average elevation, and timezones.
 *
 * @param continentCode - The 2-letter continent code (e.g., 'AS' for Asia).
 * @returns Aggregated statistics object with country breakdown.
 * @throws If the continent code format is invalid or no airports are found.
 *
 * @example
 * ```typescript
 * const stats = await getAirportStatsByContinent('EU');
 * console.log(stats.byCountry['GB']); // number of UK airports
 * console.log(stats.byCountry['FR']); // number of French airports
 * ```
 */
export async function getAirportStatsByContinent(continentCode: string = ''): Promise<AirportContinentStats> {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const index = getContinentIndex();
    const airports = index.get(continentCode) || [];

    if (airports.length === 0) {
        throw new Error(`No airports found for Continent Code: ${continentCode}`);
    }

    const timezonesSet = new Set<string>();
    const stats: AirportContinentStats = {
        total: airports.length,
        byType: {},
        byCountry: {},
        withScheduledService: 0,
        averageRunwayLength: 0,
        averageElevation: 0,
        timezones: []
    };

    let totalRunwayLength = 0;
    let runwayCount = 0;
    let totalElevation = 0;
    let elevationCount = 0;

    airports.forEach(airport => {
        const type = airport.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        const country = airport.country_code || 'unknown';
        stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;

        if (airport.scheduled_service === true || airport.scheduled_service === 'yes') {
            stats.withScheduledService++;
        }

        const runwayLength = parseInt(airport.runway_length || '0', 10);
        if (!isNaN(runwayLength) && runwayLength > 0) {
            totalRunwayLength += runwayLength;
            runwayCount++;
        }

        const elevation = parseInt(airport.elevation, 10);
        if (!isNaN(elevation)) {
            totalElevation += elevation;
            elevationCount++;
        }

        if (airport.time) {
            timezonesSet.add(airport.time);
        }
    });

    stats.averageRunwayLength = runwayCount > 0 ? Math.round(totalRunwayLength / runwayCount) : 0;
    stats.averageElevation = elevationCount > 0 ? Math.round(totalElevation / elevationCount) : 0;
    stats.timezones = Array.from(timezonesSet);

    return stats;
}

/**
 * Gets the largest airports on a continent, ranked by runway length or elevation.
 *
 * @param continentCode - The 2-letter continent code (e.g., 'AS').
 * @param limit - Maximum number of airports to return (1-1000, default: 10).
 * @param sortBy - Sort criteria: 'runway' or 'elevation' (default: 'runway').
 * @returns Array of airports sorted by the specified criteria (descending).
 * @throws If the continent code format is invalid.
 *
 * @example
 * ```typescript
 * const top5 = await getLargestAirportsByContinent('AS', 5, 'runway');
 * console.log(top5[0].runway_length); // longest runway in Asia
 * ```
 */
export async function getLargestAirportsByContinent(continentCode: string = '', limit: number = 10, sortBy: SortBy = 'runway'): Promise<Airport[]> {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    if (typeof limit !== 'number' || !isFinite(limit) || limit < 1 || limit > 1000) {
        throw new Error("Invalid limit. Must be a finite number between 1 and 1000.");
    }
    if (sortBy !== 'runway' && sortBy !== 'elevation') {
        throw new Error("Invalid sortBy value. Must be 'runway' or 'elevation'.");
    }
    const index = getContinentIndex();
    const airports = index.get(continentCode) || [];

    if (airports.length === 0) {
        throw new Error(`No airports found for Continent Code: ${continentCode}`);
    }

    const sorted = [...airports].sort((a, b) => {
        if (sortBy === 'elevation') {
            const elevA = parseInt(a.elevation, 10) || 0;
            const elevB = parseInt(b.elevation, 10) || 0;
            return elevB - elevA;
        } else {
            const runwayA = parseInt(a.runway_length || '0', 10) || 0;
            const runwayB = parseInt(b.runway_length || '0', 10) || 0;
            return runwayB - runwayA;
        }
    });

    return copyAirports(sorted.slice(0, limit));
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Fetches multiple airports by their IATA or ICAO codes in a single call.
 * Returns null for codes that don't match any airport.
 *
 * @param codes - Array of IATA or ICAO codes (max 500).
 * @returns Array of airport objects (null for unresolved codes), in the same order as input.
 * @throws If codes is not an array or exceeds 500 entries.
 *
 * @example
 * ```typescript
 * const airports = await getMultipleAirports(['SIN', 'LHR', 'JFK']);
 * console.log(airports[0]?.iata); // "SIN"
 * console.log(airports[1]?.iata); // "LHR"
 * ```
 */
export async function getMultipleAirports(codes: string[] = []): Promise<(Airport | null)[]> {
    if (!Array.isArray(codes)) {
        throw new Error("Codes must be an array of IATA or ICAO codes.");
    }
    if (codes.length > 500) {
        throw new Error("Too many codes requested. Maximum allowed is 500.");
    }

    return codes.map(code => {
        const airport = _getAirportByCodeDirect(code);
        return airport ? copyAirport(airport) : null;
    });
}

/**
 * Calculates the great-circle distance between all pairs of airports.
 * Exploits distance symmetry (d(A,B) === d(B,A)) to halve calculations.
 *
 * @param codes - Array of IATA or ICAO codes (2-100).
 * @returns Distance matrix with airport summaries and symmetric distance table.
 * @throws If fewer than 2 codes or any code is invalid.
 *
 * @example
 * ```typescript
 * const matrix = await calculateDistanceMatrix(['SIN', 'LHR', 'JFK']);
 * console.log(matrix.distances['SIN']['LHR']); // distance in km
 * console.log(matrix.distances['LHR']['SIN']); // same value (symmetric)
 * ```
 */
export async function calculateDistanceMatrix(codes: string[] = []): Promise<DistanceMatrix> {
    if (!Array.isArray(codes) || codes.length < 2) {
        throw new Error("Codes must be an array with at least 2 airport codes.");
    }
    if (codes.length > 100) {
        throw new Error("Too many codes for distance matrix. Maximum allowed is 100 (produces 10,000 calculations).");
    }

    const airports = codes.map(code => _getAirportByCodeDirect(code));

    const invalidCodes = codes.filter((code, index) => airports[index] === null);
    if (invalidCodes.length > 0) {
        throw new Error(`Invalid or not found airport codes: ${invalidCodes.join(', ')}`);
    }

    const coords = airports.map(airport => ({
        lat: parseFloat(airport!.latitude),
        lon: parseFloat(airport!.longitude)
    }));

    const n = codes.length;
    const distancesObj: Record<string, Record<string, number>> = {};
    for (let i = 0; i < n; i++) {
        distancesObj[codes[i]] = {};
        distancesObj[codes[i]][codes[i]] = 0;
    }

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const distance = Math.round(haversineDistance(
                coords[i].lat, coords[i].lon,
                coords[j].lat, coords[j].lon
            ));
            distancesObj[codes[i]][codes[j]] = distance;
            distancesObj[codes[j]][codes[i]] = distance;
        }
    }

    return {
        airports: airports.map((airport, index) => ({
            code: codes[index],
            name: airport!.airport,
            iata: airport!.iata,
            icao: airport!.icao
        })),
        distances: distancesObj
    };
}

/**
 * Finds the single nearest airport to given coordinates, optionally filtered.
 *
 * @param lat - Latitude of the search point (-90 to 90).
 * @param lon - Longitude of the search point (-180 to 180).
 * @param filters - Optional filter criteria (e.g., `{ type: 'large_airport' }`).
 * @returns The nearest airport with a `distance` field (km), or null if none found.
 *
 * @example
 * ```typescript
 * // Nearest large airport to central NYC
 * const nearest = await findNearestAirport(40.7128, -74.006, { type: 'large_airport' });
 * console.log(nearest?.iata);     // e.g., "EWR"
 * console.log(nearest?.distance); // distance in km
 * ```
 */
export async function findNearestAirport(lat: number, lon: number, filters: AirportFilters = {}): Promise<AirportWithDistance | null> {
    if (typeof lat !== 'number' || !isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error("Invalid latitude. Must be a finite number between -90 and 90.");
    }
    if (typeof lon !== 'number' || !isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error("Invalid longitude. Must be a finite number between -180 and 180.");
    }

    let nearest: AirportWithDistance | null = null;
    let minDistance = Infinity;

    if (Object.keys(filters).length > 0) {
        const airports = _findAirportsInternal(filters);

        airports.forEach(airport => {
            if (!airport.latitude || !airport.longitude) return;

            const airportLat = parseFloat(airport.latitude);
            const airportLon = parseFloat(airport.longitude);
            const distance = haversineDistance(lat, lon, airportLat, airportLon);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = { ...airport, distance: Math.round(distance * 100) / 100 };
            }
        });
    } else {
        const data = getData();
        const geo = getGeoData();

        for (let i = 0; i < geo.length; i++) {
            const g = geo[i];
            const distance = haversineDistance(lat, lon, g.lat, g.lon);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = { ...data[g.index], distance: Math.round(distance * 100) / 100 };
            }
        }
    }

    return nearest;
}

// ============================================================================
// Validation & Utilities
// ============================================================================

/**
 * Validates whether an IATA code exists in the airport database.
 *
 * @param code - The 3-letter IATA code to validate.
 * @returns True if the code exists, false otherwise.
 *
 * @example
 * ```typescript
 * await validateIataCode('SIN'); // true
 * await validateIataCode('ZZZ'); // false
 * ```
 */
export async function validateIataCode(code: string = ''): Promise<boolean> {
    if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) {
        return false;
    }
    const index = getIataIndex();
    return index.has(code);
}

/**
 * Validates whether an ICAO code exists in the airport database.
 *
 * @param code - The 4-character ICAO code to validate.
 * @returns True if the code exists, false otherwise.
 *
 * @example
 * ```typescript
 * await validateIcaoCode('WSSS'); // true
 * await validateIcaoCode('XXXX'); // false
 * ```
 */
export async function validateIcaoCode(code: string = ''): Promise<boolean> {
    if (typeof code !== 'string' || !/^[A-Z0-9]{4}$/.test(code)) {
        return false;
    }
    const index = getIcaoIndex();
    return index.has(code);
}

/**
 * Gets the count of airports matching the given filters without returning full airport data.
 *
 * @param filters - Optional filter criteria. Omit for total count.
 * @returns Count of matching airports.
 *
 * @example
 * ```typescript
 * const total = await getAirportCount();                          // all airports
 * const usLarge = await getAirportCount({ country_code: 'US', type: 'large_airport' });
 * ```
 */
export async function getAirportCount(filters: AirportFilters = {}): Promise<number> {
    if (Object.keys(filters).length === 0) {
        return getData().length;
    }
    return _findAirportsInternal(filters).length;
}

/**
 * Checks if an airport has scheduled commercial service.
 *
 * @param code - The IATA or ICAO code of the airport.
 * @returns True if the airport has scheduled service.
 * @throws If the airport is not found.
 *
 * @example
 * ```typescript
 * await isAirportOperational('SIN');  // true (Changi has scheduled flights)
 * await isAirportOperational('WSSS'); // true (same airport, ICAO code)
 * ```
 */
export async function isAirportOperational(code: string): Promise<boolean> {
    const airport = _getAirportByCodeDirect(code);
    if (!airport) {
        throw new Error(`Airport not found for code: ${code}`);
    }
    const scheduledService = airport.scheduled_service;
    return scheduledService === true ||
        scheduledService === 'yes' ||
        scheduledService === 'TRUE' ||
        scheduledService === 'true';
}

/**
 * @module airport-data
 * @description A comprehensive TypeScript library for airport data lookup by IATA, ICAO,
 * country, continent, timezone, coordinates, and more. Includes LLM-friendly typed interfaces.
 */
