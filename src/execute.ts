/**
 * Dispatches the JSON Schema tool definitions from `airport-data-js/tools` to the
 * library functions, flattening the arguments the way the schemas describe them.
 *
 * Lives in the main entry point (which has the dataset registered) rather than in
 * `airport-data-js/tools`, so the tools bundle stays small.
 */

import * as api from './core';

type Args = Record<string, unknown>;

const FILTER_KEYS = [
    'iata', 'icao', 'faa_code', 'time', 'utc', 'country_code', 'continent', 'airport',
    'city', 'city_code', 'latitude', 'longitude', 'elevation_ft', 'type', 'scheduled_service',
    'wikipedia', 'website', 'runway_length', 'flightradar24_url', 'radarbox_url',
    'flightaware_url', 'has_scheduled_service', 'min_runway_ft',
] as const;

function pickFilters(args: Args): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    for (const key of FILTER_KEYS) {
        if (args[key] !== undefined) filters[key] = args[key];
    }
    return filters;
}

const TOOL_DISPATCH: Record<string, (args: Args) => unknown> = {
    getAirportByIata: args => api.getAirportByIata(args.iataCode as string),
    getAirportByIcao: args => api.getAirportByIcao(args.icaoCode as string),
    getAirportByCountryCode: args => api.getAirportByCountryCode(args.countryCode as string),
    getAirportByContinent: args => api.getAirportByContinent(args.continentCode as string),
    searchByName: args => api.searchByName(args.query as string),
    findNearbyAirports: args => api.findNearbyAirports(
        args.lat as number,
        args.lon as number,
        (args.radiusKm as number | undefined) ?? 100,
        args.limit as number | undefined,
    ),
    getAirportsByType: args => api.getAirportsByType(args.type as string, args.limit as number | undefined),
    getAutocompleteSuggestions: args => api.getAutocompleteSuggestions(args.query as string),
    calculateDistance: args => api.calculateDistance(args.code1 as string, args.code2 as string),
    getAirportLinks: args => api.getAirportLinks(args.code as string),
    getAirportsByTimezone: args => api.getAirportsByTimezone(args.timezone as string),
    findAirports: args => api.findAirports(pickFilters(args) as Parameters<typeof api.findAirports>[0]),
    getAirportStatsByCountry: args => api.getAirportStatsByCountry(args.countryCode as string),
    getAirportStatsByContinent: args => api.getAirportStatsByContinent(args.continentCode as string),
    getLargestAirportsByContinent: args => api.getLargestAirportsByContinent(
        args.continentCode as string,
        args.limit as number | undefined,
        args.sortBy as 'runway' | 'elevation' | undefined,
    ),
    getMultipleAirports: args => api.getMultipleAirports(args.codes as string[]),
    calculateDistanceMatrix: args => api.calculateDistanceMatrix(args.codes as string[]),
    findNearestAirport: args => api.findNearestAirport(
        args.lat as number,
        args.lon as number,
        pickFilters(args) as Parameters<typeof api.findNearestAirport>[2],
    ),
    validateIataCode: args => api.validateIataCode(args.code as string),
    validateIcaoCode: args => api.validateIcaoCode(args.code as string),
    getAirportCount: args => api.getAirportCount(pickFilters(args) as Parameters<typeof api.getAirportCount>[0]),
    isAirportOperational: args => api.isAirportOperational(args.code as string),
    search: args => api.search(args.query as string, {
        limit: args.limit as number | undefined,
        scheduledOnly: args.scheduledOnly as boolean | undefined,
        types: args.types as string[] | undefined,
        country_code: args.country_code as string | undefined,
        fuzzy: args.fuzzy as boolean | undefined,
    }),
    getAirportsByCity: args => api.getAirportsByCity(args.city as string),
    getAirportsByCityCode: args => api.getAirportsByCityCode(args.cityCode as string),
    getUtcOffset: args => api.getUtcOffset(args.code as string, args.date as string | undefined),
    getLocalTime: args => api.getLocalTime(args.code as string, args.date as string | undefined),
    formatAirportTime: args => {
        const { code, ...options } = args;
        return api.formatAirportTime(code as string, options as Parameters<typeof api.formatAirportTime>[1]);
    },
};

/**
 * Executes a tool by name with arguments shaped like its JSON Schema
 * (see `airport-data-js/tools`). Flattened tool arguments are mapped back to the
 * function signatures, so no hand-mapping is needed.
 *
 * @param name - One of the names in `airportTools`.
 * @param args - Arguments for the tool.
 * @returns Whatever the underlying function returns.
 * @throws If the tool name is unknown or the arguments are invalid.
 *
 * @example
 * ```typescript
 * import { executeTool } from 'airport-data-js';
 *
 * const airports = await executeTool('search', { query: 'New York', limit: 3 });
 * const airport = await executeTool('getAirportByIata', { iataCode: 'LHR' });
 * ```
 */
export async function executeTool(name: string, args: Args = {}): Promise<unknown> {
    const dispatch = TOOL_DISPATCH[name];
    if (!dispatch) {
        throw new Error(`Unknown tool: ${name}. Available tools: ${Object.keys(TOOL_DISPATCH).join(', ')}`);
    }
    return dispatch(args);
}
