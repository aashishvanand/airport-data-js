import jsonpack from 'jsonpack';
import compressedData from './airports.compressed';

let airportsData = null;
let iataIndex = null;
let icaoIndex = null;
let countryIndex = null;
let continentIndex = null;
let timezoneIndex = null;
let typeIndex = null;
let geoData = null; // Pre-computed geographic data for each airport

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/**
 * Converts degrees to radians.
 * @private
 * @param {number} deg - Value in degrees.
 * @returns {number} Value in radians.
 */
function toRad(deg) {
    return deg * DEG_TO_RAD;
}

/**
 * Computes the Haversine great-circle distance between two points.
 * Uses pre-computed radian values when available.
 * @private
 * @param {number} lat1 - Latitude of point 1 in degrees.
 * @param {number} lon1 - Longitude of point 1 in degrees.
 * @param {number} lat2 - Latitude of point 2 in degrees.
 * @param {number} lon2 - Longitude of point 2 in degrees.
 * @returns {number} Distance in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
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
 * Pre-computes geographic data (parsed lat/lon as numbers) for all airports.
 * Avoids repeated parseFloat calls in geographic search functions.
 * @private
 * @returns {Array<object>} Array of { lat, lon, index } objects for airports with valid coordinates.
 */
function getGeoData() {
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
 * Builds and returns an index of airports by country code.
 * Lazy loads the index on first access.
 * @private
 * @returns {Map<string, Array<object>>}
 */
function getCountryIndex() {
    if (!countryIndex) {
        const data = getData();
        countryIndex = new Map();
        data.forEach(airport => {
            if (airport.country_code) {
                if (!countryIndex.has(airport.country_code)) {
                    countryIndex.set(airport.country_code, []);
                }
                countryIndex.get(airport.country_code).push(airport);
            }
        });
    }
    return countryIndex;
}

/**
 * Builds and returns an index of airports by continent code.
 * Lazy loads the index on first access.
 * @private
 * @returns {Map<string, Array<object>>}
 */
function getContinentIndex() {
    if (!continentIndex) {
        const data = getData();
        continentIndex = new Map();
        data.forEach(airport => {
            if (airport.continent) {
                if (!continentIndex.has(airport.continent)) {
                    continentIndex.set(airport.continent, []);
                }
                continentIndex.get(airport.continent).push(airport);
            }
        });
    }
    return continentIndex;
}

/**
 * Builds and returns an index of airports by timezone.
 * Lazy loads the index on first access.
 * @private
 * @returns {Map<string, Array<object>>}
 */
function getTimezoneIndex() {
    if (!timezoneIndex) {
        const data = getData();
        timezoneIndex = new Map();
        data.forEach(airport => {
            if (airport.time) {
                if (!timezoneIndex.has(airport.time)) {
                    timezoneIndex.set(airport.time, []);
                }
                timezoneIndex.get(airport.time).push(airport);
            }
        });
    }
    return timezoneIndex;
}

/**
 * Builds and returns an index of airports by type.
 * Lazy loads the index on first access.
 * @private
 * @returns {Map<string, Array<object>>}
 */
function getTypeIndex() {
    if (!typeIndex) {
        const data = getData();
        typeIndex = new Map();
        data.forEach(airport => {
            if (airport.type) {
                const lowerType = airport.type.toLowerCase();
                if (!typeIndex.has(lowerType)) {
                    typeIndex.set(lowerType, []);
                }
                typeIndex.get(lowerType).push(airport);
            }
        });
    }
    return typeIndex;
}

/**
 * Returns a shallow copy of an airport object to prevent mutation of cached data.
 * @private
 * @param {object} airport - The airport object to copy.
 * @returns {object} A shallow copy of the airport object.
 */
function copyAirport(airport) {
    return { ...airport };
}

/**
 * Returns shallow copies of an array of airport objects.
 * @private
 * @param {Array<object>} airports - The airport objects to copy.
 * @returns {Array<object>} An array of shallow copies.
 */
function copyAirports(airports) {
    return airports.map(a => ({ ...a }));
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
        return results && results.length > 0 ? copyAirport(results[0]) : null;
    }

    // Validate and filter based on ICAO code format (4 uppercase letters/numbers)
    if (/^[A-Z0-9]{4}$/.test(code)) {
        const index = getIcaoIndex();
        const results = index.get(code);
        return results && results.length > 0 ? copyAirport(results[0]) : null;
    }

    return null; // Return null if format is not recognized
}

/**
 * (Private) A helper function to get an airport by either IATA or ICAO code
 * without defensive copying. For internal use where copies are not needed.
 * @private
 * @param {string} code - A 3-letter IATA or 4-character ICAO code.
 * @returns {object|null} The first matching airport object (original reference), or null.
 */
function _getAirportByCodeDirect(code) {
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
    return copyAirports(results);
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
    return copyAirports(results);
}

/**
 * Finds airports by their 2-letter country code.
 * Uses a pre-built index for O(1) lookup instead of scanning all airports.
 *
 * @param {string} countryCode - The country code to search for (e.g., 'US').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the country code format is invalid or if no data is found.
 */
async function getAirportByCountryCode(countryCode = '') {
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
 * Uses a pre-built index for O(1) lookup instead of scanning all airports.
 *
 * @param {string} continentCode - The continent code to search for (e.g., 'AS' for Asia).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching airport objects.
 * @throws {Error} Throws an error if the continent code format is invalid or if no data is found.
 */
async function getAirportByContinent(continentCode = '') {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const index = getContinentIndex();
    const results = index.get(continentCode) || [];
    if (results.length === 0) {
        throw new Error(`No data found for Continent Code: ${continentCode}`);
    }
    return copyAirports(results);
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
    if (query.length > 100) {
        throw new Error("Search query must not exceed 100 characters.");
    }
    const lowerCaseQuery = query.toLowerCase();

    // Corrected to use 'airport' key instead of 'name'
    const results = getData().filter(item =>
        item.airport.toLowerCase().includes(lowerCaseQuery)
    );

    return copyAirports(results);
}

/**
 * Finds airports within a specified radius (in kilometers) of a given latitude and longitude.
 * Uses a bounding-box pre-filter to skip expensive Haversine calculations for distant airports.
 *
 * @param {number} lat - The latitude of the center point.
 * @param {number} lon - The longitude of the center point.
 * @param {number} radiusKm - The search radius in kilometers. Defaults to 100.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of airports within the radius.
 */
async function findNearbyAirports(lat, lon, radiusKm = 100) {
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

    // Bounding-box pre-filter: approximate degrees per km at the given latitude.
    // 1 degree of latitude ~ 111 km everywhere.
    // 1 degree of longitude ~ 111 * cos(lat) km.
    const latDelta = radiusKm / 111;
    const cosLat = Math.cos(toRad(lat));
    const lonDelta = cosLat > 0.001 ? radiusKm / (111 * cosLat) : 360;

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const results = [];

    for (let i = 0; i < geo.length; i++) {
        const g = geo[i];

        // Bounding-box check (very fast, eliminates most candidates)
        if (g.lat < minLat || g.lat > maxLat) continue;
        if (g.lon < minLon || g.lon > maxLon) continue;

        // Full Haversine only for candidates within bounding box
        const distance = haversineDistance(lat, lon, g.lat, g.lon);
        if (distance <= radiusKm) {
            results.push(data[g.index]);
        }
    }

    return copyAirports(results);
}

/**
 * Finds airports by their type (e.g., 'large_airport', 'medium_airport', 'small_airport', 'heliport', 'seaplane_base').
 * Uses a pre-built index for O(1) lookup on exact matches.
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
    const index = getTypeIndex();

    // Exact match via index (fast path)
    const exactResults = index.get(lowerCaseType);
    if (exactResults) {
        return copyAirports(exactResults);
    }

    // Special case: 'airport' matches all types containing 'airport'
    // Aggregate from index entries instead of scanning all records
    if (lowerCaseType === 'airport') {
        const results = [];
        for (const [key, airports] of index) {
            if (key.includes('airport')) {
                results.push(...airports);
            }
        }
        return copyAirports(results);
    }

    // No match found
    return [];
}


/**
 * Calculates the great-circle distance between two airports using their IATA or ICAO codes.
 *
 * @param {string} code1 - The IATA or ICAO code of the first airport.
 * @param {string} code2 - The IATA or ICAO code of the second airport.
 * @returns {Promise<number|null>} The distance in kilometers, or null if an airport is not found.
 */
async function calculateDistance(code1, code2) {
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
 * Provides a list of airports for autocomplete suggestions based on a query.
 * It searches by airport name, city, and IATA code.
 *
 * @param {string} query - The partial query string from the user.
 * @returns {Promise<Array<object>>} A promise resolving to a list of matching airports.
 */
async function getAutocompleteSuggestions(query = '') {
    if (typeof query !== 'string' || query.length < 2 || query.length > 100) {
        return [];
    }
    const lowerCaseQuery = query.toLowerCase();

    // Collect only up to 10 results to avoid unnecessary work
    const data = getData();
    const results = [];
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
 * Set of allowed filter keys to prevent prototype pollution.
 * Only known airport data properties can be used as filter keys.
 * @private
 */
const ALLOWED_FILTER_KEYS = new Set([
    'iata', 'icao', 'time', 'utc', 'country_code', 'continent',
    'airport', 'latitude', 'longitude', 'elevation_ft', 'elevation',
    'type', 'scheduled_service', 'wikipedia', 'website',
    'runway_length', 'flightradar24_url', 'radarbox_url', 'flightaware_url',
    'has_scheduled_service', 'min_runway_ft'
]);

/**
 * Internal implementation of findAirports that returns references (no copies).
 * Used by other internal functions that need to filter without copying overhead.
 * @private
 * @param {object} filters - An object of filters to apply.
 * @returns {Array<object>} Array of matching airport references (NOT copies).
 */
function _findAirportsInternal(filters = {}) {
    const filterKeys = Object.keys(filters);
    for (const key of filterKeys) {
        if (!ALLOWED_FILTER_KEYS.has(key)) {
            throw new Error(`Unrecognized filter key: '${key}'. Allowed keys: ${[...ALLOWED_FILTER_KEYS].join(', ')}`);
        }
    }

    // Optimization: Use indexes for single-key filters when possible
    let candidateSet = null;

    // Check if we can narrow down candidates using indexes
    for (const key of filterKeys) {
        const filterValue = filters[key];
        let indexed = null;

        switch (key) {
            case 'country_code':
                indexed = getCountryIndex().get(filterValue) || [];
                break;
            case 'continent':
                indexed = getContinentIndex().get(filterValue) || [];
                break;
            case 'type': {
                const lowerType = (typeof filterValue === 'string') ? filterValue.toLowerCase() : '';
                indexed = getTypeIndex().get(lowerType) || [];
                break;
            }
            case 'time':
                indexed = getTimezoneIndex().get(filterValue) || [];
                break;
            case 'iata':
                indexed = getIataIndex().get(filterValue) || [];
                break;
            case 'icao':
                indexed = getIcaoIndex().get(filterValue) || [];
                break;
        }

        if (indexed !== null) {
            if (candidateSet === null) {
                candidateSet = indexed;
            } else {
                // Intersect with previous candidate set (use the smaller set)
                const refSet = new Set(indexed);
                candidateSet = candidateSet.filter(a => refSet.has(a));
            }
        }
    }

    const airports = candidateSet !== null ? candidateSet : getData();

    const results = airports.filter(airport => {
        for (const key of filterKeys) {
            const filterValue = filters[key];
            switch (key) {
                // Skip keys already used for index lookup (exact match already guaranteed)
                case 'country_code':
                case 'continent':
                case 'time':
                case 'iata':
                case 'icao':
                    // Only skip if we used the index (candidateSet !== null)
                    if (candidateSet !== null) break;
                    if (!Object.prototype.hasOwnProperty.call(airport, key) || airport[key] !== filterValue) return false;
                    break;

                case 'type':
                    // Type index uses lowercase, so if we used it, still need case check
                    if (candidateSet !== null) break;
                    if (!Object.prototype.hasOwnProperty.call(airport, key) || airport[key] !== filterValue) return false;
                    break;

                case 'has_scheduled_service': {
                    const scheduledService = airport.scheduled_service;
                    const expectedValue = filterValue;
                    let actualValue = scheduledService;
                    if (typeof scheduledService === 'string') {
                        actualValue = scheduledService.toLowerCase() === 'yes';
                    }
                    if (actualValue !== expectedValue) return false;
                    break;
                }

                case 'min_runway_ft': {
                    const runwayLength = parseInt(airport.runway_length, 10) || 0;
                    if (runwayLength < filterValue) return false;
                    break;
                }

                default:
                    if (!Object.prototype.hasOwnProperty.call(airport, key) || airport[key] !== filterValue) return false;
            }
        }
        return true;
    });

    return results;
}

/**
 * Finds airports that match multiple criteria.
 * @param {object} filters - An object of filters to apply.
 * @returns {Promise<Array<object>>} A promise resolving to matching airports.
 * @throws {Error} Throws an error if an unrecognized filter key is provided.
 */
async function findAirports(filters = {}) {
    return copyAirports(_findAirportsInternal(filters));
}


/**
 * Finds all airports within a specific timezone.
 * Uses a pre-built index for O(1) lookup instead of scanning all airports.
 * @param {string} timezone - The timezone identifier (e.g., 'Europe/London').
 * @returns {Promise<Array<object>>} A promise resolving to matching airports.
 */
async function getAirportsByTimezone(timezone = '') {
    if (!timezone) throw new Error("Timezone cannot be empty.");
    const index = getTimezoneIndex();
    const results = index.get(timezone) || [];
    return copyAirports(results);
}

/**
 * Gets a map of external links for a given airport.
 * @param {string} code - The IATA or ICAO code of the airport.
 * @returns {Promise<object|null>} A promise resolving to an object of links, or null.
 */
async function getAirportLinks(code) {
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
 * Uses a pre-built index for O(1) lookup instead of scanning all airports.
 * @param {string} countryCode - The 2-letter country code (e.g., 'US').
 * @returns {Promise<object>} Statistics including count by type, average runway length, etc.
 * @throws {Error} Throws an error if the country code format is invalid.
 */
async function getAirportStatsByCountry(countryCode = '') {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    const index = getCountryIndex();
    const airports = index.get(countryCode) || [];

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
 * Uses a pre-built index for O(1) lookup instead of scanning all airports.
 * @param {string} continentCode - The 2-letter continent code (e.g., 'AS' for Asia).
 * @returns {Promise<object>} Statistics including count by type, average runway length, etc.
 * @throws {Error} Throws an error if the continent code format is invalid.
 */
async function getAirportStatsByContinent(continentCode = '') {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const index = getContinentIndex();
    const airports = index.get(continentCode) || [];

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
 * Uses a pre-built index for O(1) lookup instead of scanning all airports.
 * @param {string} continentCode - The 2-letter continent code (e.g., 'AS').
 * @param {number} limit - Maximum number of airports to return (default: 10).
 * @param {string} sortBy - Sort criteria: 'runway' or 'elevation' (default: 'runway').
 * @returns {Promise<Array<object>>} Array of airports sorted by the specified criteria.
 * @throws {Error} Throws an error if the continent code format is invalid.
 */
async function getLargestAirportsByContinent(continentCode = '', limit = 10, sortBy = 'runway') {
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

    // Sort a copy to avoid mutating the index array
    const sorted = [...airports].sort((a, b) => {
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

    return copyAirports(sorted.slice(0, limit));
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Fetches multiple airports by their IATA or ICAO codes in one call.
 * Uses direct lookups without unnecessary async overhead.
 * @param {Array<string>} codes - Array of IATA or ICAO codes.
 * @returns {Promise<Array<object>>} Array of airport objects (nulls for not found).
 */
async function getMultipleAirports(codes = []) {
    if (!Array.isArray(codes)) {
        throw new Error("Codes must be an array of IATA or ICAO codes.");
    }
    if (codes.length > 500) {
        throw new Error("Too many codes requested. Maximum allowed is 500.");
    }

    // Use synchronous direct lookups - no need for Promise.all with async _getAirportByCode
    return codes.map(code => {
        const airport = _getAirportByCodeDirect(code);
        return airport ? copyAirport(airport) : null;
    });
}

/**
 * Calculates distances between all pairs of airports in a list.
 * Exploits distance symmetry (d(A,B) == d(B,A)) to halve calculations.
 * @param {Array<string>} codes - Array of IATA or ICAO codes.
 * @returns {Promise<object>} Object with distance matrix and airport details.
 */
async function calculateDistanceMatrix(codes = []) {
    if (!Array.isArray(codes) || codes.length < 2) {
        throw new Error("Codes must be an array with at least 2 airport codes.");
    }
    if (codes.length > 100) {
        throw new Error("Too many codes for distance matrix. Maximum allowed is 100 (produces 10,000 calculations).");
    }

    // Fetch all airports at once using direct lookups (no copies needed for distance calc)
    const airports = codes.map(code => _getAirportByCodeDirect(code));

    // Check for any null values
    const invalidCodes = codes.filter((code, index) => airports[index] === null);
    if (invalidCodes.length > 0) {
        throw new Error(`Invalid or not found airport codes: ${invalidCodes.join(', ')}`);
    }

    // Pre-parse coordinates once
    const coords = airports.map(airport => ({
        lat: parseFloat(airport.latitude),
        lon: parseFloat(airport.longitude)
    }));

    // Calculate distance matrix, exploiting symmetry (d(A,B) == d(B,A))
    const n = codes.length;
    // Initialize matrix with zeros on the diagonal
    const distancesObj = {};
    for (let i = 0; i < n; i++) {
        distancesObj[codes[i]] = {};
        distancesObj[codes[i]][codes[i]] = 0;
    }

    // Only compute upper triangle, mirror to lower triangle
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
            name: airport.airport,
            iata: airport.iata,
            icao: airport.icao
        })),
        distances: distancesObj
    };
}

/**
 * Finds the single nearest airport to given coordinates, optionally with filters.
 * Uses pre-computed geographic data and avoids unnecessary copies.
 * @param {number} lat - Latitude of the search point.
 * @param {number} lon - Longitude of the search point.
 * @param {object} filters - Optional filters (e.g., { type: 'large_airport' }).
 * @returns {Promise<object|null>} The nearest airport object with distance, or null.
 */
async function findNearestAirport(lat, lon, filters = {}) {
    if (typeof lat !== 'number' || !isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error("Invalid latitude. Must be a finite number between -90 and 90.");
    }
    if (typeof lon !== 'number' || !isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error("Invalid longitude. Must be a finite number between -180 and 180.");
    }

    let nearest = null;
    let minDistance = Infinity;

    if (Object.keys(filters).length > 0) {
        // Use internal filter (no copies) then iterate
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
        // No filters: use pre-computed geo data for maximum performance
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
 * Avoids creating defensive copies since we only need the count.
 * @param {object} filters - Optional filters to apply.
 * @returns {Promise<number>} Count of matching airports.
 */
async function getAirportCount(filters = {}) {
    if (Object.keys(filters).length === 0) {
        return getData().length;
    }
    // Use internal filter (no copies) since we only need the count
    return _findAirportsInternal(filters).length;
}

/**
 * Checks if an airport has scheduled commercial service.
 * @param {string} code - The IATA or ICAO code of the airport.
 * @returns {Promise<boolean>} True if the airport has scheduled service, false otherwise.
 */
async function isAirportOperational(code) {
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
