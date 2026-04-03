import type { Airport, AirportWithDistance, AirportLinks, AirportCountryStats, AirportContinentStats, DistanceMatrix } from '../types/index';

const {
    getAirportByIata,
    getAirportByIcao,
    getAirportByCountryCode,
    getAirportByContinent,
    searchByName,
    findNearbyAirports,
    getAirportsByType,
    getAutocompleteSuggestions,
    calculateDistance,
    findAirports,
    getAirportsByTimezone,
    getAirportLinks,
    getAirportStatsByCountry,
    getAirportStatsByContinent,
    getLargestAirportsByContinent,
    getMultipleAirports,
    calculateDistanceMatrix,
    findNearestAirport,
    validateIataCode,
    validateIcaoCode,
    getAirportCount,
    isAirportOperational
} = require('../lib/index.js');

describe('Airport Data Library (Live Data)', () => {

    // ========================================================================
    // Core Search Functions
    // ========================================================================

    describe('getAirportByIata', () => {
        test('should retrieve airport data for a valid IATA code', async () => {
            const [airport]: Airport[] = await getAirportByIata('LHR');
            expect(airport.iata).toBe('LHR');
            expect(airport.airport).toContain('Heathrow');
        });
    });

    describe('getAirportByIcao', () => {
        test('should retrieve airport data for a valid ICAO code', async () => {
            const [airport]: Airport[] = await getAirportByIcao('EGLL');
            expect(airport.icao).toBe('EGLL');
            expect(airport.airport).toContain('Heathrow');
        });
    });

    describe('getAirportByCountryCode', () => {
        test('should retrieve all airports for a given country code', async () => {
            const airports: Airport[] = await getAirportByCountryCode('US');
            expect(airports.length).toBeGreaterThan(100);
            expect(airports[0].country_code).toBe('US');
        });
    });

    describe('getAirportByContinent', () => {
        test('should retrieve all airports for a given continent code', async () => {
            const airports: Airport[] = await getAirportByContinent('EU');
            expect(airports.length).toBeGreaterThan(100);
            expect(airports.every((a: Airport) => a.continent === 'EU')).toBe(true);
        });
    });

    describe('findNearbyAirports', () => {
        test('should find airports within a given radius', async () => {
            const lat = 51.5074;
            const lon = -0.1278;
            const airports: Airport[] = await findNearbyAirports(lat, lon, 50);
            expect(airports.length).toBeGreaterThanOrEqual(1);
            expect(airports.some((a: Airport) => a.iata === 'LHR')).toBe(true);
        });
    });

    describe('getAirportsByType', () => {
        test('should retrieve all large airports', async () => {
            const airports: Airport[] = await getAirportsByType('large_airport');
            expect(airports.length).toBeGreaterThan(10);
            expect(airports.every((a: Airport) => a.type === 'large_airport')).toBe(true);
        });

        test('should retrieve all medium airports', async () => {
            const airports: Airport[] = await getAirportsByType('medium_airport');
            expect(airports.length).toBeGreaterThan(10);
            expect(airports.every((a: Airport) => a.type === 'medium_airport')).toBe(true);
        });

        test('should retrieve all airports when searching for "airport"', async () => {
            const airports: Airport[] = await getAirportsByType('airport');
            expect(airports.length).toBeGreaterThan(50);
            expect(airports.every((a: Airport) => a.type && a.type.includes('airport'))).toBe(true);
        });

        test('should handle different airport types', async () => {
            const heliports: Airport[] = await getAirportsByType('heliport');
            expect(Array.isArray(heliports)).toBe(true);
            if (heliports.length > 0) {
                expect(heliports.every((a: Airport) => a.type === 'heliport')).toBe(true);
            }

            const seaplaneBases: Airport[] = await getAirportsByType('seaplane_base');
            expect(Array.isArray(seaplaneBases)).toBe(true);
            if (seaplaneBases.length > 0) {
                expect(seaplaneBases.every((a: Airport) => a.type === 'seaplane_base')).toBe(true);
            }
        });

        test('should handle case-insensitive searches', async () => {
            const upperCase: Airport[] = await getAirportsByType('LARGE_AIRPORT');
            const lowerCase: Airport[] = await getAirportsByType('large_airport');
            expect(upperCase.length).toBe(lowerCase.length);
            expect(upperCase.length).toBeGreaterThan(0);
        });

        test('should return empty array for non-existent type', async () => {
            const airports: Airport[] = await getAirportsByType('nonexistent_type');
            expect(airports.length).toBe(0);
        });
    });

    describe('getAutocompleteSuggestions', () => {
        test('should return suggestions based on airport name', async () => {
            const suggestions: Airport[] = await getAutocompleteSuggestions('London');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.length).toBeLessThanOrEqual(10);
            expect(suggestions.some((a: Airport) => a.iata === 'LHR')).toBe(true);
        });
    });

    describe('calculateDistance', () => {
        test('should calculate the distance between two airports using IATA codes', async () => {
            const distance: number = await calculateDistance('LHR', 'JFK');
            expect(distance).toBeCloseTo(5541, 0);
        });
    });

    describe('findAirports (Advanced Filtering)', () => {
        test('should find airports with multiple matching criteria', async () => {
            const airports: Airport[] = await findAirports({ country_code: 'GB', type: 'airport' });
            expect(airports.length).toBeGreaterThanOrEqual(0);
            expect(airports.every((a: Airport) => a.country_code === 'GB' && a.type.toLowerCase() === 'airport')).toBe(true);
        });

        test('should filter by scheduled service availability', async () => {
            const airportsWithService: Airport[] = await findAirports({ has_scheduled_service: true });
            const airportsWithoutService: Airport[] = await findAirports({ has_scheduled_service: false });

            expect(airportsWithService.length + airportsWithoutService.length).toBeGreaterThan(0);

            if (airportsWithService.length > 0) {
                expect(airportsWithService.every((a: Airport) => {
                    const scheduled = typeof a.scheduled_service === 'string'
                        ? a.scheduled_service.toLowerCase() === 'yes'
                        : a.scheduled_service === true;
                    return scheduled;
                })).toBe(true);
            }

            if (airportsWithoutService.length > 0) {
                expect(airportsWithoutService.every((a: Airport) => {
                    const scheduled = typeof a.scheduled_service === 'string'
                        ? a.scheduled_service.toLowerCase() === 'yes'
                        : a.scheduled_service === true;
                    return !scheduled;
                })).toBe(true);
            }
        });
    });

    describe('getAirportsByTimezone', () => {
        test('should find all airports within a specific timezone', async () => {
            const airports: Airport[] = await getAirportsByTimezone('Europe/London');
            expect(airports.length).toBeGreaterThan(10);
            expect(airports.every((a: Airport) => a.time === 'Europe/London')).toBe(true);
        });
    });

    describe('getAirportLinks', () => {
        test('should retrieve a map of all available external links', async () => {
            const links: AirportLinks = await getAirportLinks('LHR');
            expect(links.wikipedia).toContain('Heathrow_Airport');
            expect(links.website).not.toBeUndefined();
        });

        test('should handle airports with missing links gracefully', async () => {
            const links: AirportLinks = await getAirportLinks('HND');
            expect(links.wikipedia).toContain('Tokyo_International_Airport');
            expect(links.website).not.toBeUndefined();
        });
    });

    // ========================================================================
    // Statistical & Analytical Functions
    // ========================================================================

    describe('getAirportStatsByCountry', () => {
        test('should return comprehensive statistics for a country', async () => {
            const stats: AirportCountryStats = await getAirportStatsByCountry('SG');
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('withScheduledService');
            expect(stats).toHaveProperty('averageRunwayLength');
            expect(stats).toHaveProperty('averageElevation');
            expect(stats).toHaveProperty('timezones');
            expect(stats.total).toBeGreaterThan(0);
            expect(Array.isArray(stats.timezones)).toBe(true);
        });

        test('should calculate correct statistics for US airports', async () => {
            const stats: AirportCountryStats = await getAirportStatsByCountry('US');
            expect(stats.total).toBeGreaterThan(1000);
            expect(stats.byType).toHaveProperty('large_airport');
            expect(stats.byType.large_airport).toBeGreaterThan(0);
        });

        test('should throw error for invalid country code', async () => {
            await expect(getAirportStatsByCountry('XYZ')).rejects.toThrow();
        });
    });

    describe('getAirportStatsByContinent', () => {
        test('should return comprehensive statistics for a continent', async () => {
            const stats: AirportContinentStats = await getAirportStatsByContinent('AS');
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('byCountry');
            expect(stats).toHaveProperty('withScheduledService');
            expect(stats.total).toBeGreaterThan(100);
            expect(Object.keys(stats.byCountry).length).toBeGreaterThan(10);
        });

        test('should include country breakdown', async () => {
            const stats: AirportContinentStats = await getAirportStatsByContinent('EU');
            expect(stats.byCountry).toHaveProperty('GB');
            expect(stats.byCountry).toHaveProperty('FR');
            expect(stats.byCountry).toHaveProperty('DE');
        });
    });

    describe('getLargestAirportsByContinent', () => {
        test('should return top airports by runway length', async () => {
            const airports: Airport[] = await getLargestAirportsByContinent('AS', 5, 'runway');
            expect(airports.length).toBeLessThanOrEqual(5);
            expect(airports.length).toBeGreaterThan(0);
            for (let i = 0; i < airports.length - 1; i++) {
                const runway1 = parseInt(airports[i].runway_length || '0', 10) || 0;
                const runway2 = parseInt(airports[i + 1].runway_length || '0', 10) || 0;
                expect(runway1).toBeGreaterThanOrEqual(runway2);
            }
        });

        test('should return top airports by elevation', async () => {
            const airports: Airport[] = await getLargestAirportsByContinent('SA', 5, 'elevation');
            expect(airports.length).toBeLessThanOrEqual(5);
            for (let i = 0; i < airports.length - 1; i++) {
                const elev1 = parseInt(airports[i].elevation, 10) || 0;
                const elev2 = parseInt(airports[i + 1].elevation, 10) || 0;
                expect(elev1).toBeGreaterThanOrEqual(elev2);
            }
        });

        test('should respect the limit parameter', async () => {
            const airports: Airport[] = await getLargestAirportsByContinent('EU', 3);
            expect(airports.length).toBeLessThanOrEqual(3);
        });
    });

    // ========================================================================
    // Bulk Operations
    // ========================================================================

    describe('getMultipleAirports', () => {
        test('should fetch multiple airports by IATA codes', async () => {
            const airports: (Airport | null)[] = await getMultipleAirports(['SIN', 'LHR', 'JFK']);
            expect(airports.length).toBe(3);
            expect(airports[0]!.iata).toBe('SIN');
            expect(airports[1]!.iata).toBe('LHR');
            expect(airports[2]!.iata).toBe('JFK');
        });

        test('should handle mix of IATA and ICAO codes', async () => {
            const airports: (Airport | null)[] = await getMultipleAirports(['SIN', 'EGLL', 'JFK']);
            expect(airports.length).toBe(3);
            expect(airports.every((a: Airport | null) => a !== null)).toBe(true);
        });

        test('should return null for invalid codes', async () => {
            const airports: (Airport | null)[] = await getMultipleAirports(['SIN', 'INVALID', 'LHR']);
            expect(airports.length).toBe(3);
            expect(airports[0]).not.toBeNull();
            expect(airports[1]).toBeNull();
            expect(airports[2]).not.toBeNull();
        });

        test('should handle empty array', async () => {
            const airports: (Airport | null)[] = await getMultipleAirports([]);
            expect(airports.length).toBe(0);
        });
    });

    describe('calculateDistanceMatrix', () => {
        test('should calculate distance matrix for multiple airports', async () => {
            const matrix: DistanceMatrix = await calculateDistanceMatrix(['SIN', 'LHR', 'JFK']);
            expect(matrix).toHaveProperty('airports');
            expect(matrix).toHaveProperty('distances');
            expect(matrix.airports.length).toBe(3);

            expect(matrix.distances.SIN.SIN).toBe(0);
            expect(matrix.distances.LHR.LHR).toBe(0);
            expect(matrix.distances.JFK.JFK).toBe(0);

            expect(matrix.distances.SIN.LHR).toBe(matrix.distances.LHR.SIN);
            expect(matrix.distances.SIN.JFK).toBe(matrix.distances.JFK.SIN);

            expect(matrix.distances.SIN.LHR).toBeGreaterThan(5000);
            expect(matrix.distances.LHR.JFK).toBeGreaterThan(3000);
        });

        test('should throw error for less than 2 airports', async () => {
            await expect(calculateDistanceMatrix(['SIN'])).rejects.toThrow();
        });

        test('should throw error for invalid codes', async () => {
            await expect(calculateDistanceMatrix(['SIN', 'INVALID'])).rejects.toThrow();
        });
    });

    describe('findNearestAirport', () => {
        test('should find nearest airport to coordinates', async () => {
            const nearest: AirportWithDistance = await findNearestAirport(1.35019, 103.994003);
            expect(nearest).toHaveProperty('distance');
            expect(nearest.iata).toBe('SIN');
            expect(nearest.distance).toBeLessThan(2);
        });

        test('should find nearest airport with type filter', async () => {
            const nearest: AirportWithDistance = await findNearestAirport(51.5074, -0.1278, {
                type: 'large_airport'
            });
            expect(nearest).not.toBeNull();
            expect(nearest.type).toBe('large_airport');
            expect(nearest).toHaveProperty('distance');
        });

        test('should find nearest airport with type and country filters', async () => {
            const nearest: AirportWithDistance = await findNearestAirport(40.7128, -74.0060, {
                type: 'large_airport',
                country_code: 'US'
            });
            expect(nearest).not.toBeNull();
            expect(nearest).toHaveProperty('distance');
            expect(nearest.type).toBe('large_airport');
            expect(nearest.country_code).toBe('US');
        });
    });

    // ========================================================================
    // Validation & Utilities
    // ========================================================================

    describe('validateIataCode', () => {
        test('should return true for valid IATA codes', async () => {
            expect(await validateIataCode('SIN')).toBe(true);
            expect(await validateIataCode('LHR')).toBe(true);
            expect(await validateIataCode('JFK')).toBe(true);
        });

        test('should return false for invalid IATA codes', async () => {
            expect(await validateIataCode('XYZ')).toBe(false);
            expect(await validateIataCode('ZZZ')).toBe(false);
        });

        test('should return false for incorrect format', async () => {
            expect(await validateIataCode('ABCD')).toBe(false);
            expect(await validateIataCode('AB')).toBe(false);
            expect(await validateIataCode('abc')).toBe(false);
            expect(await validateIataCode('')).toBe(false);
        });
    });

    describe('validateIcaoCode', () => {
        test('should return true for valid ICAO codes', async () => {
            expect(await validateIcaoCode('WSSS')).toBe(true);
            expect(await validateIcaoCode('EGLL')).toBe(true);
            expect(await validateIcaoCode('KJFK')).toBe(true);
        });

        test('should return false for invalid ICAO codes', async () => {
            expect(await validateIcaoCode('XXXX')).toBe(false);
            expect(await validateIcaoCode('ZZZ0')).toBe(false);
        });

        test('should return false for incorrect format', async () => {
            expect(await validateIcaoCode('ABC')).toBe(false);
            expect(await validateIcaoCode('ABCDE')).toBe(false);
            expect(await validateIcaoCode('abcd')).toBe(false);
            expect(await validateIcaoCode('')).toBe(false);
        });
    });

    describe('getAirportCount', () => {
        test('should return total count of all airports', async () => {
            const count: number = await getAirportCount();
            expect(count).toBeGreaterThan(5000);
        });

        test('should return count with type filter', async () => {
            const largeCount: number = await getAirportCount({ type: 'large_airport' });
            const totalCount: number = await getAirportCount();
            expect(largeCount).toBeGreaterThan(0);
            expect(largeCount).toBeLessThan(totalCount);
        });

        test('should return count with country filter', async () => {
            const usCount: number = await getAirportCount({ country_code: 'US' });
            expect(usCount).toBeGreaterThan(1000);
        });

        test('should return count with multiple filters', async () => {
            const count: number = await getAirportCount({
                country_code: 'US',
                type: 'large_airport'
            });
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThan(200);
        });
    });

    describe('isAirportOperational', () => {
        test('should return true for operational airports', async () => {
            expect(await isAirportOperational('SIN')).toBe(true);
            expect(await isAirportOperational('LHR')).toBe(true);
            expect(await isAirportOperational('JFK')).toBe(true);
        });

        test('should work with both IATA and ICAO codes', async () => {
            expect(await isAirportOperational('SIN')).toBe(true);
            expect(await isAirportOperational('WSSS')).toBe(true);
        });

        test('should throw error for invalid airport code', async () => {
            await expect(isAirportOperational('INVALID')).rejects.toThrow();
        });
    });
});
