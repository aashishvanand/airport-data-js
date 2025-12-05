import jsonpack from 'jsonpack';
import compressedData from './airports.compressed';

let airportsData = null;
let iataIndex = null;
let icaoIndex = null;

/**
 * Unpacks the compressed airport data into a usable JavaScript array.
 * Lazy loads the data on first access.
 * @returns {Array<object>}
 */
function getData() {
    if (!airportsData) {
        airportsData = jsonpack.unpack(compressedData);
    }
    return airportsData;
}

/**
 * Builds and returns an index of airports by IATA code.
 * Lazy loads the index on first access.
 * @returns {Map<string, Array<object>>}
 */
function getIataIndex() {
    if (!iataIndex) {
        const data = getData();
        iataIndex = new Map();
        data.forEach(airport => {
            if (airport.iata) {
                if (!iataIndex.has(airport.iata)) {
                    iataIndex.set(airport.iata, []);
                }
                iataIndex.get(airport.iata).push(airport);
            }
        });
    }
    return iataIndex;
}

/**
 * Builds and returns an index of airports by ICAO code.
 * Lazy loads the index on first access.
 * @returns {Map<string, Array<object>>}
 */
function getIcaoIndex() {
    if (!icaoIndex) {
        const data = getData();
        icaoIndex = new Map();
        data.forEach(airport => {
            if (airport.icao) {
                if (!icaoIndex.has(airport.icao)) {
                    icaoIndex.set(airport.icao, []);
                }
                icaoIndex.get(airport.icao).push(airport);
            }
        });
    }
    return icaoIndex;
}

/**
 * Validates a string against a regular expression and throws an error if it doesn't match.
 * @private
 * @param {string} data - The data to validate.
 * @param {RegExp} regex - The regular expression to test against.
 * @param {string} errorMessage - The error message to throw if validation fails.
 * @throws {Error} Throws an error if the data does not match the regex.
 */
function validateRegex(data, regex, errorMessage) {
    if (!regex.test(data)) {
        throw new Error(errorMessage);
    }
}

/**
 * (Private) A helper function to get an airport by either IATA or ICAO code.
 * @private
 * @param {string} code - A 3-letter IATA or 4-character ICAO code.
 * @returns {Promise<object|null>} A promise that resolves to the first matching airport object, or null.
 */
async function _getAirportByCode(code) {
    if (typeof code !== 'string') return null;

    // Validate and filter based on IATA code format (3 uppercase letters)
    if (/^[A-Z]{3}$/.test(code)) {
        const index = getIataIndex();
        const results = index.get(code);
        return results && results.length > 0 ? results[0] : null;
    }

    // Validate and filter based on ICAO code format (4 uppercase letters/numbers)
    if (/^[A-Z0-9]{4}$/.test(code)) {
        const index = getIcaoIndex();
        const results = index.get(code);
        return results && results.length > 0 ? results[0] : null;
    }

    return null; // Return null if format is not recognized
}

/**
 * Finds airports by their 3-letter IATA code.
 *
 * @param {string} iataCode - The IATA code of the airport to find (e.g., 'AAA').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the IATA code format is invalid or if no data is found.
 */
async function getAirportByIata(iataCode = '') {
    validateRegex(iataCode, /^[A-Z]{3}$/, "Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'.");
    const index = getIataIndex();
    const results = index.get(iataCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for IATA code: ${iataCode}`);
    }
    return results;
}

/**
 * Finds airports by their 4-character ICAO code.
 *
 * @param {string} icaoCode - The ICAO code of the airport to find (e.g., 'NTGA').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the ICAO code format is invalid or if no data is found.
 */
async function getAirportByIcao(icaoCode = '') {
    validateRegex(icaoCode, /^[A-Z0-9]{4}$/, "Invalid ICAO format. Please provide a 4-character uppercase code, e.g., 'NTGA'.");
    const index = getIcaoIndex();
    const results = index.get(icaoCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for ICAO code: ${icaoCode}`);
    }
    return results;
}

/**
 * Finds airports by their 2-letter country code.
 *
 * @param {string} countryCode - The country code to search for (e.g., 'US').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the country code format is invalid or if no data is found.
 */
async function getAirportByCountryCode(countryCode = '') {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    const results = getData().filter(airport => airport.country_code === countryCode);
    if (results.length === 0) {
        throw new Error(`No data found for Country Code: ${countryCode}`);
    }
    return results;
}

/**
 * Finds airports by their 2-letter continent code.
 *
 * @param {string} continentCode - The continent code to search for (e.g., 'AS' for Asia).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the continent code format is invalid or if no data is found.
 */
async function getAirportByContinent(continentCode = '') {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const results = getData().filter(airport => airport.continent === continentCode);
    if (results.length === 0) {
        throw new Error(`No data found for Continent Code: ${continentCode}`);
    }
    return results;
}

/**
 * Searches for airports by their name. Case-insensitive.
 *
 * @param {string} query - The name or partial name to search for (e.g., "Heathrow").
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 */
async function searchByName(query = '') {
    if (typeof query !== 'string' || query.length < 2) {
        throw new Error("Search query must be at least 2 characters long.");
    }
    const lowerCaseQuery = query.toLowerCase();

    // Corrected to use 'airport' key instead of 'name'
    const results = getData().filter(item =>
        item.airport.toLowerCase().includes(lowerCaseQuery)
    );

    return results;
}

/**
 * Finds airports within a specified radius (in kilometers) of a given latitude and longitude.
 *
 * @param {number} lat - The latitude of the center point.
 * @param {number} lon - The longitude of the center point.
 * @param {number} radiusKm - The search radius in kilometers. Defaults to 100.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of airports within the radius.
 */
async function findNearbyAirports(lat, lon, radiusKm = 100) {
    const R = 6371; // Radius of the Earth in kilometers
    const toRad = (value) => (value * Math.PI) / 180;

    const results = getData().filter(airport => {
        // Use 'latitude' and 'longitude' and ensure they exist
        if (!airport.latitude || !airport.longitude) return false;

        // Convert string coordinates to numbers before calculating
        const airportLat = parseFloat(airport.latitude);
        const airportLon = parseFloat(airport.longitude);

        const dLat = toRad(airportLat - lat);
        const dLon = toRad(airportLon - lon);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat)) * Math.cos(toRad(airportLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= radiusKm;
    });

    return results;
}

/**
 * Finds airports by their type (e.g., 'large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base').
 *
 * @param {string} type - The type of airport to filter by.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the type is not a non-empty string.
 */
async function getAirportsByType(type = '') {
    if (typeof type !== 'string' || type.length === 0) {
        throw new Error("Invalid type provided.");
    }
    const lowerCaseType = type.toLowerCase();
    return getData().filter(airport => {
        // Handle both exact matches and partial matches for convenience
        if (!airport.type) return false;
        const airportType = airport.type.toLowerCase();

        // Exact match first
        if (airportType === lowerCaseType) return true;

        // Allow partial matching for convenience (e.g., 'airport' matches 'large_airport')
        if (lowerCaseType === 'airport' && airportType.includes('airport')) return true;

        return false;
    });
}


/**
 * Calculates the great-circle distance between two airports using their IATA or ICAO codes.
 *
 * @param {string} code1 - The IATA or ICAO code of the first airport.
 * @param {string} code2 - The IATA or ICAO code of the second airport.
 * @returns {Promise<number|null>} The distance in kilometers, or null if an airport is not found.
 */
async function calculateDistance(code1, code2) {
    const airport1 = await _getAirportByCode(code1);
    const airport2 = await _getAirportByCode(code2);

    if (!airport1 || !airport2) {
        return null;
    }

    const R = 6371; // Radius of the Earth in kilometers
    const toRad = (value) => (value * Math.PI) / 180;

    const lat1 = parseFloat(airport1.latitude);
    const lon1 = parseFloat(airport1.longitude);
    const lat2 = parseFloat(airport2.latitude);
    const lon2 = parseFloat(airport2.longitude);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Provides a list of airports for autocomplete suggestions based on a query.
 * It searches by airport name, city, and IATA code.
 *
 * @param {string} query - The partial query string from the user.
 * @returns {Promise<Array<object>>} A promise resolving to a list of matching airports.
 */
async function getAutocompleteSuggestions(query = '') {
    if (typeof query !== 'string' || query.length < 2) {
        return [];
    }
    const lowerCaseQuery = query.toLowerCase();

    const results = getData().filter(item =>
        item.airport.toLowerCase().includes(lowerCaseQuery) ||
        item.iata.toLowerCase().includes(lowerCaseQuery)
    );

    // Return a limited number of results for performance
    return results.slice(0, 10);
}

/**
 * Finds airports that match multiple criteria.
 * @param {object} filters - An object of filters to apply.
 * @returns {Promise<Array<object>>} A promise resolving to matching airports.
 */
async function findAirports(filters = {}) {
    return getData().filter(airport => {
        for (const key in filters) {
            const filterValue = filters[key];
            switch (key) {
                case 'has_scheduled_service':
                    // Check if the airport's scheduled_service matches the filter
                    // Handle both boolean and string representations
                    const scheduledService = airport.scheduled_service;
                    const expectedValue = filterValue;

                    // Convert string "yes"/"no" to boolean if needed
                    let actualValue = scheduledService;
                    if (typeof scheduledService === 'string') {
                        actualValue = scheduledService.toLowerCase() === 'yes';
                    }

                    if (actualValue !== expectedValue) return false;
                    break;

                case 'min_runway_ft':
                    const runwayLength = parseInt(airport.runway_length, 10) || 0;
                    if (runwayLength < filterValue) return false;
                    break;

                default:
                    // For other filters, do exact match
                    if (airport[key] !== filterValue) return false;
            }
        }
        return true;
    });
}


/**
 * Finds all airports within a specific timezone.
 * @param {string} timezone - The timezone identifier (e.g., 'Europe/London').
 * @returns {Promise<Array<object>>} A promise resolving to matching airports.
 */
async function getAirportsByTimezone(timezone = '') {
    if (!timezone) throw new Error("Timezone cannot be empty.");
    // The data key is 'time', you might want to alias it to 'timezone'
    return getData().filter(airport => airport.time === timezone);
}

/**
 * Gets a map of external links for a given airport.
 * @param {string} code - The IATA or ICAO code of the airport.
 * @returns {Promise<object|null>} A promise resolving to an object of links, or null.
 */
async function getAirportLinks(code) {
    const airport = await _getAirportByCode(code); // Using your internal helper
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
 * @param {string} countryCode - The 2-letter country code (e.g., 'US').
 * @returns {Promise<object>} Statistics including count by type, average runway length, etc.
 * @throws {Error} Throws an error if the country code format is invalid.
 */
async function getAirportStatsByCountry(countryCode = '') {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    const airports = getData().filter(airport => airport.country_code === countryCode);

    if (airports.length === 0) {
        throw new Error(`No airports found for Country Code: ${countryCode}`);
    }

    const stats = {
        total: airports.length,
        byType: {},
        withScheduledService: 0,
        averageRunwayLength: 0,
        averageElevation: 0,
        timezones: new Set()
    };

    let totalRunwayLength = 0;
    let runwayCount = 0;
    let totalElevation = 0;
    let elevationCount = 0;

    airports.forEach(airport => {
        // Count by type
        const type = airport.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count scheduled service
        if (airport.scheduled_service === true || airport.scheduled_service === 'yes') {
            stats.withScheduledService++;
        }

        // Calculate average runway length
        const runwayLength = parseInt(airport.runway_length, 10);
        if (!isNaN(runwayLength) && runwayLength > 0) {
            totalRunwayLength += runwayLength;
            runwayCount++;
        }

        // Calculate average elevation
        const elevation = parseInt(airport.elevation, 10);
        if (!isNaN(elevation)) {
            totalElevation += elevation;
            elevationCount++;
        }

        // Collect timezones
        if (airport.time) {
            stats.timezones.add(airport.time);
        }
    });

    stats.averageRunwayLength = runwayCount > 0 ? Math.round(totalRunwayLength / runwayCount) : 0;
    stats.averageElevation = elevationCount > 0 ? Math.round(totalElevation / elevationCount) : 0;
    stats.timezones = Array.from(stats.timezones);

    return stats;
}

/**
 * Gets comprehensive statistics about airports on a specific continent.
 * @param {string} continentCode - The 2-letter continent code (e.g., 'AS' for Asia).
 * @returns {Promise<object>} Statistics including count by type, average runway length, etc.
 * @throws {Error} Throws an error if the continent code format is invalid.
 */
async function getAirportStatsByContinent(continentCode = '') {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const airports = getData().filter(airport => airport.continent === continentCode);

    if (airports.length === 0) {
        throw new Error(`No airports found for Continent Code: ${continentCode}`);
    }

    const stats = {
        total: airports.length,
        byType: {},
        byCountry: {},
        withScheduledService: 0,
        averageRunwayLength: 0,
        averageElevation: 0,
        timezones: new Set()
    };

    let totalRunwayLength = 0;
    let runwayCount = 0;
    let totalElevation = 0;
    let elevationCount = 0;

    airports.forEach(airport => {
        // Count by type
        const type = airport.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count by country
        const country = airport.country_code || 'unknown';
        stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;

        // Count scheduled service
        if (airport.scheduled_service === true || airport.scheduled_service === 'yes') {
            stats.withScheduledService++;
        }

        // Calculate average runway length
        const runwayLength = parseInt(airport.runway_length, 10);
        if (!isNaN(runwayLength) && runwayLength > 0) {
            totalRunwayLength += runwayLength;
            runwayCount++;
        }

        // Calculate average elevation
        const elevation = parseInt(airport.elevation, 10);
        if (!isNaN(elevation)) {
            totalElevation += elevation;
            elevationCount++;
        }

        // Collect timezones
        if (airport.time) {
            stats.timezones.add(airport.time);
        }
    });

    stats.averageRunwayLength = runwayCount > 0 ? Math.round(totalRunwayLength / runwayCount) : 0;
    stats.averageElevation = elevationCount > 0 ? Math.round(totalElevation / elevationCount) : 0;
    stats.timezones = Array.from(stats.timezones);

    return stats;
}

/**
 * Gets the largest airports on a continent by runway length or elevation.
 * @param {string} continentCode - The 2-letter continent code (e.g., 'AS').
 * @param {number} limit - Maximum number of airports to return (default: 10).
 * @param {string} sortBy - Sort criteria: 'runway' or 'elevation' (default: 'runway').
 * @returns {Promise<Array<object>>} Array of airports sorted by the specified criteria.
 * @throws {Error} Throws an error if the continent code format is invalid.
 */
async function getLargestAirportsByContinent(continentCode = '', limit = 10, sortBy = 'runway') {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const airports = getData().filter(airport => airport.continent === continentCode);

    if (airports.length === 0) {
        throw new Error(`No airports found for Continent Code: ${continentCode}`);
    }

    // Sort based on criteria
    const sorted = airports.sort((a, b) => {
        if (sortBy === 'elevation') {
            const elevA = parseInt(a.elevation, 10) || 0;
            const elevB = parseInt(b.elevation, 10) || 0;
            return elevB - elevA;
        } else {
            // Default to runway length
            const runwayA = parseInt(a.runway_length, 10) || 0;
            const runwayB = parseInt(b.runway_length, 10) || 0;
            return runwayB - runwayA;
        }
    });

    return sorted.slice(0, limit);
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Fetches multiple airports by their IATA or ICAO codes in one call.
 * @param {Array<string>} codes - Array of IATA or ICAO codes.
 * @returns {Promise<Array<object>>} Array of airport objects (nulls for not found).
 */
async function getMultipleAirports(codes = []) {
    if (!Array.isArray(codes)) {
        throw new Error("Codes must be an array of IATA or ICAO codes.");
    }

    const results = await Promise.all(
        codes.map(async code => {
            try {
                const airport = await _getAirportByCode(code);
                return airport;
            } catch (error) {
                return null;
            }
        })
    );

    return results;
}

/**
 * Calculates distances between all pairs of airports in a list.
 * @param {Array<string>} codes - Array of IATA or ICAO codes.
 * @returns {Promise<object>} Object with distance matrix and airport details.
 */
async function calculateDistanceMatrix(codes = []) {
    if (!Array.isArray(codes) || codes.length < 2) {
        throw new Error("Codes must be an array with at least 2 airport codes.");
    }

    // Fetch all airports
    const airports = await getMultipleAirports(codes);

    // Check for any null values
    const invalidCodes = codes.filter((code, index) => airports[index] === null);
    if (invalidCodes.length > 0) {
        throw new Error(`Invalid or not found airport codes: ${invalidCodes.join(', ')}`);
    }

    // Calculate distance matrix
    const matrix = {};

    for (let i = 0; i < codes.length; i++) {
        matrix[codes[i]] = {};
        for (let j = 0; j < codes.length; j++) {
            if (i === j) {
                matrix[codes[i]][codes[j]] = 0;
            } else {
                const distance = await calculateDistance(codes[i], codes[j]);
                matrix[codes[i]][codes[j]] = Math.round(distance);
            }
        }
    }

    return {
        airports: airports.map((airport, index) => ({
            code: codes[index],
            name: airport.airport,
            iata: airport.iata,
            icao: airport.icao
        })),
        distances: matrix
    };
}

/**
 * Finds the single nearest airport to given coordinates, optionally with filters.
 * @param {number} lat - Latitude of the search point.
 * @param {number} lon - Longitude of the search point.
 * @param {object} filters - Optional filters (e.g., { type: 'large_airport' }).
 * @returns {Promise<object|null>} The nearest airport object with distance, or null.
 */
async function findNearestAirport(lat, lon, filters = {}) {
    const R = 6371; // Radius of the Earth in kilometers
    const toRad = (value) => (value * Math.PI) / 180;

    let airports = getData();

    // Apply filters if provided
    if (Object.keys(filters).length > 0) {
        airports = await findAirports(filters);
    }

    let nearest = null;
    let minDistance = Infinity;

    airports.forEach(airport => {
        if (!airport.latitude || !airport.longitude) return;

        const airportLat = parseFloat(airport.latitude);
        const airportLon = parseFloat(airport.longitude);

        const dLat = toRad(airportLat - lat);
        const dLon = toRad(airportLon - lon);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat)) * Math.cos(toRad(airportLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance < minDistance) {
            minDistance = distance;
            nearest = { ...airport, distance: Math.round(distance * 100) / 100 };
        }
    });

    return nearest;
}

// ============================================================================
// Validation & Utilities
// ============================================================================

/**
 * Validates if an IATA code exists in the database.
 * @param {string} code - The IATA code to validate.
 * @returns {Promise<boolean>} True if the code exists, false otherwise.
 */
async function validateIataCode(code = '') {
    if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) {
        return false;
    }
    const index = getIataIndex();
    return index.has(code);
}

/**
 * Validates if an ICAO code exists in the database.
 * @param {string} code - The ICAO code to validate.
 * @returns {Promise<boolean>} True if the code exists, false otherwise.
 */
async function validateIcaoCode(code = '') {
    if (typeof code !== 'string' || !/^[A-Z0-9]{4}$/.test(code)) {
        return false;
    }
    const index = getIcaoIndex();
    return index.has(code);
}

/**
 * Gets the count of airports matching the given filters without fetching all data.
 * @param {object} filters - Optional filters to apply.
 * @returns {Promise<number>} Count of matching airports.
 */
async function getAirportCount(filters = {}) {
    if (Object.keys(filters).length === 0) {
        return getData().length;
    }
    const results = await findAirports(filters);
    return results.length;
}

/**
 * Checks if an airport has scheduled commercial service.
 * @param {string} code - The IATA or ICAO code of the airport.
 * @returns {Promise<boolean>} True if the airport has scheduled service, false otherwise.
 */
async function isAirportOperational(code) {
    const airport = await _getAirportByCode(code);
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
 * @description A library to retrieve airport data by various codes.
 */
module.exports = {
    // Core search functions
    getAirportByIata,
    getAirportByIcao,
    getAirportByCountryCode,
    getAirportByContinent,
    searchByName,
    findNearbyAirports,
    getAirportsByType,
    getAutocompleteSuggestions,
    calculateDistance,
    getAirportLinks,
    getAirportsByTimezone,
    findAirports,

    // Statistical & Analytical Functions
    getAirportStatsByCountry,
    getAirportStatsByContinent,
    getLargestAirportsByContinent,

    // Bulk Operations
    getMultipleAirports,
    calculateDistanceMatrix,
    findNearestAirport,

    // Validation & Utilities
    validateIataCode,
    validateIcaoCode,
    getAirportCount,
    isAirportOperational
};