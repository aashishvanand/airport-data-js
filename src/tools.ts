/**
 * @module airport-data/tools
 *
 * Pre-built JSON Schema tool definitions for all airport-data functions.
 * Use these with LLM tool-calling frameworks like OpenAI function calling,
 * Anthropic tool use, Vercel AI SDK, or LangChain.
 *
 * @example
 * ```typescript
 * import { airportTools } from 'airport-data-js/tools';
 *
 * // OpenAI function calling
 * const response = await openai.chat.completions.create({
 *     model: 'gpt-4',
 *     messages: [...],
 *     tools: airportTools.map(t => ({ type: 'function', function: t })),
 * });
 *
 * // Anthropic tool use
 * const response = await anthropic.messages.create({
 *     model: 'claude-sonnet-4-20250514',
 *     messages: [...],
 *     tools: airportTools.map(t => ({
 *         name: t.name,
 *         description: t.description,
 *         input_schema: t.parameters,
 *     })),
 * });
 * ```
 */

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
            items?: { type: string };
            default?: unknown;
            minimum?: number;
            maximum?: number;
        }>;
        required: string[];
    };
}

export const airportTools: ToolDefinition[] = [
    {
        name: 'getAirportByIata',
        description: 'Look up an airport by its 3-letter IATA code (e.g., "LHR" for London Heathrow, "JFK" for New York JFK, "SIN" for Singapore Changi). Returns full airport details including location, timezone, and links.',
        parameters: {
            type: 'object',
            properties: {
                iataCode: {
                    type: 'string',
                    description: '3-letter uppercase IATA airport code (e.g., "LHR", "JFK", "SIN")'
                }
            },
            required: ['iataCode']
        }
    },
    {
        name: 'getAirportByIcao',
        description: 'Look up an airport by its 4-character ICAO code (e.g., "EGLL" for London Heathrow, "KJFK" for New York JFK). Returns full airport details.',
        parameters: {
            type: 'object',
            properties: {
                icaoCode: {
                    type: 'string',
                    description: '4-character uppercase ICAO airport code (e.g., "EGLL", "KJFK", "WSSS")'
                }
            },
            required: ['icaoCode']
        }
    },
    {
        name: 'getAirportByCountryCode',
        description: 'Get all airports in a country by its ISO 3166-1 alpha-2 code (e.g., "US" for United States, "GB" for United Kingdom, "SG" for Singapore).',
        parameters: {
            type: 'object',
            properties: {
                countryCode: {
                    type: 'string',
                    description: '2-letter uppercase ISO country code (e.g., "US", "GB", "SG")'
                }
            },
            required: ['countryCode']
        }
    },
    {
        name: 'getAirportByContinent',
        description: 'Get all airports on a continent. Valid codes: AF (Africa), AN (Antarctica), AS (Asia), EU (Europe), NA (North America), OC (Oceania), SA (South America).',
        parameters: {
            type: 'object',
            properties: {
                continentCode: {
                    type: 'string',
                    description: '2-letter continent code',
                    enum: ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']
                }
            },
            required: ['continentCode']
        }
    },
    {
        name: 'searchByName',
        description: 'Search for airports by name using case-insensitive partial matching. Use this when you have an airport name but not its code (e.g., "Heathrow", "Changi", "Charles de Gaulle").',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Airport name or partial name to search for (2-100 characters)'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'findNearbyAirports',
        description: 'Find all airports within a radius of a geographic point. Useful for finding airports near a city or location.',
        parameters: {
            type: 'object',
            properties: {
                lat: {
                    type: 'number',
                    description: 'Latitude in decimal degrees (-90 to 90)',
                    minimum: -90,
                    maximum: 90
                },
                lon: {
                    type: 'number',
                    description: 'Longitude in decimal degrees (-180 to 180)',
                    minimum: -180,
                    maximum: 180
                },
                radiusKm: {
                    type: 'number',
                    description: 'Search radius in kilometers',
                    default: 100
                }
            },
            required: ['lat', 'lon']
        }
    },
    {
        name: 'getAirportsByType',
        description: 'Filter airports by classification type. Types: "large_airport", "medium_airport", "small_airport", "heliport", "seaplane_base", "closed". Pass "airport" to get all airport types.',
        parameters: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Airport type classification',
                    enum: ['large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base', 'closed', 'airport']
                }
            },
            required: ['type']
        }
    },
    {
        name: 'getAutocompleteSuggestions',
        description: 'Get autocomplete suggestions for airports based on partial input. Matches IATA/ICAO codes, city names, metro codes, and airport names, with major airports first. Returns up to 10 results.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Partial search query (2-100 characters)'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'calculateDistance',
        description: 'Calculate the great-circle (Haversine) distance in kilometers between two airports. Accepts either IATA or ICAO codes.',
        parameters: {
            type: 'object',
            properties: {
                code1: {
                    type: 'string',
                    description: 'IATA or ICAO code of the first airport'
                },
                code2: {
                    type: 'string',
                    description: 'IATA or ICAO code of the second airport'
                }
            },
            required: ['code1', 'code2']
        }
    },
    {
        name: 'getAirportLinks',
        description: 'Get external links for an airport including Wikipedia, official website, FlightRadar24, RadarBox, and FlightAware URLs.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'IATA or ICAO code of the airport'
                }
            },
            required: ['code']
        }
    },
    {
        name: 'getAirportsByTimezone',
        description: 'Get all airports in a specific IANA timezone (e.g., "Europe/London", "Asia/Singapore", "America/New_York").',
        parameters: {
            type: 'object',
            properties: {
                timezone: {
                    type: 'string',
                    description: 'IANA timezone identifier (e.g., "Europe/London")'
                }
            },
            required: ['timezone']
        }
    },
    {
        name: 'findAirports',
        description: 'Advanced multi-criteria airport search. Combine filters with AND logic. Supports country, continent, type, timezone, scheduled service, and minimum runway length filters.',
        parameters: {
            type: 'object',
            properties: {
                country_code: {
                    type: 'string',
                    description: '2-letter ISO country code filter'
                },
                continent: {
                    type: 'string',
                    description: '2-letter continent code filter',
                    enum: ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']
                },
                type: {
                    type: 'string',
                    description: 'Airport type filter',
                    enum: ['large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base', 'closed']
                },
                has_scheduled_service: {
                    type: 'boolean',
                    description: 'Filter by scheduled commercial service availability'
                },
                min_runway_ft: {
                    type: 'number',
                    description: 'Minimum runway length in feet'
                },
                time: {
                    type: 'string',
                    description: 'IANA timezone filter'
                }
            },
            required: [] as string[]
        }
    },
    {
        name: 'getAirportStatsByCountry',
        description: 'Get aggregated airport statistics for a country: total count, breakdown by type, scheduled service count, average runway length, average elevation, and timezones.',
        parameters: {
            type: 'object',
            properties: {
                countryCode: {
                    type: 'string',
                    description: '2-letter uppercase ISO country code'
                }
            },
            required: ['countryCode']
        }
    },
    {
        name: 'getAirportStatsByContinent',
        description: 'Get aggregated airport statistics for a continent: total count, breakdown by type and country, scheduled service count, average runway length, and average elevation.',
        parameters: {
            type: 'object',
            properties: {
                continentCode: {
                    type: 'string',
                    description: '2-letter continent code',
                    enum: ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']
                }
            },
            required: ['continentCode']
        }
    },
    {
        name: 'getLargestAirportsByContinent',
        description: 'Get the top airports on a continent ranked by runway length or elevation.',
        parameters: {
            type: 'object',
            properties: {
                continentCode: {
                    type: 'string',
                    description: '2-letter continent code',
                    enum: ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']
                },
                limit: {
                    type: 'number',
                    description: 'Number of results to return (1-1000)',
                    default: 10
                },
                sortBy: {
                    type: 'string',
                    description: 'Ranking criteria',
                    enum: ['runway', 'elevation']
                }
            },
            required: ['continentCode']
        }
    },
    {
        name: 'getMultipleAirports',
        description: 'Fetch multiple airports in a single call by their IATA or ICAO codes. Returns null for unresolved codes. Maximum 500 codes.',
        parameters: {
            type: 'object',
            properties: {
                codes: {
                    type: 'array',
                    description: 'Array of IATA or ICAO codes',
                    items: { type: 'string' }
                }
            },
            required: ['codes']
        }
    },
    {
        name: 'calculateDistanceMatrix',
        description: 'Calculate distances between all pairs of airports. Returns a symmetric distance matrix. Maximum 100 codes.',
        parameters: {
            type: 'object',
            properties: {
                codes: {
                    type: 'array',
                    description: 'Array of 2-100 IATA or ICAO codes',
                    items: { type: 'string' }
                }
            },
            required: ['codes']
        }
    },
    {
        name: 'findNearestAirport',
        description: 'Find the single closest airport to a geographic point, optionally filtered by type, country, or other criteria.',
        parameters: {
            type: 'object',
            properties: {
                lat: {
                    type: 'number',
                    description: 'Latitude in decimal degrees (-90 to 90)',
                    minimum: -90,
                    maximum: 90
                },
                lon: {
                    type: 'number',
                    description: 'Longitude in decimal degrees (-180 to 180)',
                    minimum: -180,
                    maximum: 180
                },
                type: {
                    type: 'string',
                    description: 'Optional airport type filter',
                    enum: ['large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base']
                },
                country_code: {
                    type: 'string',
                    description: 'Optional 2-letter country code filter'
                }
            },
            required: ['lat', 'lon']
        }
    },
    {
        name: 'validateIataCode',
        description: 'Check whether a 3-letter IATA code exists in the airport database. Returns true/false.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: '3-letter IATA code to validate'
                }
            },
            required: ['code']
        }
    },
    {
        name: 'validateIcaoCode',
        description: 'Check whether a 4-character ICAO code exists in the airport database. Returns true/false.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: '4-character ICAO code to validate'
                }
            },
            required: ['code']
        }
    },
    {
        name: 'getAirportCount',
        description: 'Get the count of airports matching optional filters. Call with no filters for the total number of airports in the database.',
        parameters: {
            type: 'object',
            properties: {
                country_code: {
                    type: 'string',
                    description: 'Optional country code filter'
                },
                type: {
                    type: 'string',
                    description: 'Optional airport type filter'
                },
                continent: {
                    type: 'string',
                    description: 'Optional continent code filter'
                }
            },
            required: [] as string[]
        }
    },
    {
        name: 'isAirportOperational',
        description: 'Check whether an airport has scheduled commercial service (is operational). Accepts IATA or ICAO code.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'IATA or ICAO code of the airport'
                }
            },
            required: ['code']
        }
    },
    {
        name: 'search',
        description: 'Ranked airport search across codes, cities, and names. Best general-purpose lookup when the user gives a city ("New York", "London"), a metro code ("NYC", "LON"), an airport name ("Heathrow"), or a code. Accent-insensitive and typo-tolerant; major airports with scheduled service rank first. Pass limit/scheduledOnly/country_code as the second (options) argument.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search text, 2-100 characters (e.g., "new york", "LON", "heathrow", "Zürich")'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results (1-100, default 10)',
                    minimum: 1,
                    maximum: 100
                },
                scheduledOnly: {
                    type: 'boolean',
                    description: 'Only return airports with scheduled commercial service'
                },
                country_code: {
                    type: 'string',
                    description: 'Optional 2-letter ISO country code filter (e.g., "US")'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'getAirportsByCity',
        description: 'Find airports serving a city by name (case- and accent-insensitive), major airports first. Some airports list their own municipality (e.g., EWR is "Newark"); use getAirportsByCityCode for whole metro areas.',
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: 'City name (e.g., "London", "São Paulo", "Tokyo")'
                }
            },
            required: ['city']
        }
    },
    {
        name: 'getAirportsByCityCode',
        description: 'Find all airports in an IATA city/metropolitan area code (e.g., "NYC" for JFK, LGA, EWR; "LON" for LHR, LGW, STN, LTN, LCY; "TYO" for HND, NRT).',
        parameters: {
            type: 'object',
            properties: {
                cityCode: {
                    type: 'string',
                    description: '3-letter uppercase IATA city code (e.g., "NYC", "LON", "PAR")'
                }
            },
            required: ['cityCode']
        }
    },
    {
        name: 'getUtcOffset',
        description: 'Get the real UTC offset in hours at an airport for a given moment, accounting for daylight saving time (e.g., JFK is -4 in July and -5 in December). Prefer this over the static utc field.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'IATA or ICAO code of the airport'
                },
                date: {
                    type: 'string',
                    description: 'Optional ISO 8601 date-time (default: now)'
                }
            },
            required: ['code']
        }
    },
    {
        name: 'getLocalTime',
        description: 'Get the current (or a given) local date and time at an airport, with UTC offset and whether daylight saving time is in effect.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'IATA or ICAO code of the airport'
                },
                date: {
                    type: 'string',
                    description: 'Optional ISO 8601 date-time to convert (default: now)'
                }
            },
            required: ['code']
        }
    },
    {
        name: 'formatAirportTime',
        description: 'Format a moment as a human-readable string in the airport\'s local time zone and a given locale. Pass date/locale/dateStyle/timeStyle as the second (options) argument.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'IATA or ICAO code of the airport'
                },
                date: {
                    type: 'string',
                    description: 'Optional ISO 8601 date-time to format (default: now)'
                },
                locale: {
                    type: 'string',
                    description: 'Optional BCP 47 locale (default: "en-US")'
                },
                dateStyle: {
                    type: 'string',
                    description: 'Optional date style',
                    enum: ['full', 'long', 'medium', 'short']
                },
                timeStyle: {
                    type: 'string',
                    description: 'Optional time style',
                    enum: ['full', 'long', 'medium', 'short']
                }
            },
            required: ['code']
        }
    }
];
