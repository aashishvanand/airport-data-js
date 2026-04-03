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
export declare function getAirportByIata(iataCode?: string): Promise<Airport[]>;
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
export declare function getAirportByIcao(icaoCode?: string): Promise<Airport[]>;
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
export declare function getAirportByCountryCode(countryCode?: string): Promise<Airport[]>;
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
export declare function getAirportByContinent(continentCode?: string): Promise<Airport[]>;
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
export declare function searchByName(query?: string): Promise<Airport[]>;
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
export declare function findNearbyAirports(lat: number, lon: number, radiusKm?: number): Promise<Airport[]>;
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
export declare function getAirportsByType(type?: string): Promise<Airport[]>;
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
export declare function calculateDistance(code1: string, code2: string): Promise<number | null>;
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
export declare function getAutocompleteSuggestions(query?: string): Promise<Airport[]>;
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
export declare function findAirports(filters?: AirportFilters): Promise<Airport[]>;
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
export declare function getAirportsByTimezone(timezone?: string): Promise<Airport[]>;
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
export declare function getAirportLinks(code: string): Promise<AirportLinks | null>;
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
export declare function getAirportStatsByCountry(countryCode?: string): Promise<AirportCountryStats>;
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
export declare function getAirportStatsByContinent(continentCode?: string): Promise<AirportContinentStats>;
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
export declare function getLargestAirportsByContinent(continentCode?: string, limit?: number, sortBy?: SortBy): Promise<Airport[]>;
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
export declare function getMultipleAirports(codes?: string[]): Promise<(Airport | null)[]>;
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
export declare function calculateDistanceMatrix(codes?: string[]): Promise<DistanceMatrix>;
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
export declare function findNearestAirport(lat: number, lon: number, filters?: AirportFilters): Promise<AirportWithDistance | null>;
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
export declare function validateIataCode(code?: string): Promise<boolean>;
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
export declare function validateIcaoCode(code?: string): Promise<boolean>;
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
export declare function getAirportCount(filters?: AirportFilters): Promise<number>;
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
export declare function isAirportOperational(code: string): Promise<boolean>;
/**
 * @module airport-data
 * @description A comprehensive TypeScript library for airport data lookup by IATA, ICAO,
 * country, continent, timezone, coordinates, and more. Includes LLM-friendly typed interfaces.
 */
