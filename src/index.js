import jsonpack from 'jsonpack';
import compressedData from './airports.compressed';

/**
 * Unpacks the compressed airport data into a usable JavaScript array.
 * @type {Array<object>}
 */
const airportsData = jsonpack.unpack(compressedData);

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
        const results = airportsData.filter(airport => airport.iata === code);
        return results.length > 0 ? results[0] : null;
    }
    
    // Validate and filter based on ICAO code format (4 uppercase letters/numbers)
    if (/^[A-Z0-9]{4}$/.test(code)) {
        const results = airportsData.filter(airport => airport.icao === code);
        return results.length > 0 ? results[0] : null;
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
    const results = airportsData.filter(airport => airport.iata === iataCode);
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
    const results = airportsData.filter(airport => airport.icao === icaoCode);
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
    const results = airportsData.filter(airport => airport.country_code === countryCode);
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
    const results = airportsData.filter(airport => airport.continent === continentCode);
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
    const results = airportsData.filter(item =>
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

    const results = airportsData.filter(airport => {
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
    return airportsData.filter(airport => {
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

    const results = airportsData.filter(item =>
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
    return airportsData.filter(airport => {
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
    return airportsData.filter(airport => airport.time === timezone);
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

/**
 * @module airport-data
 * @description A library to retrieve airport data by various codes.
 */
module.exports = {
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
    findAirports
};