const fs = require('fs');
const zlib = require('zlib');

let airportsData = [];

// Load compressed JSON data into memory
function loadJSONData() {
    if (airportsData.length) return;

    const compressedData = fs.readFileSync('./src/airports.gz');
    const rawData = zlib.gunzipSync(compressedData).toString();
    airportsData = JSON.parse(rawData);
}

function validateRegex(value, pattern, errorMessage) {
    if (!value.match(pattern)) {
        throw new Error(errorMessage);
    }
}

function getAirportByIata(iataCode) {
    validateRegex(iataCode, /^[A-Z]{3}$/, "Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'.");
    return airportsData.filter(airport => airport.iata === iataCode);
}

function getAirportByIcao(icaoCode) {
    validateRegex(icaoCode, /^[A-Z0-9]{4}$/, "Invalid ICAO format. Please provide a 4-character uppercase code, e.g., 'NTGA'.");
    return airportsData.filter(airport => airport.icao === icaoCode);
}

function getAirportByCityCode(cityCode) {
    validateRegex(cityCode, /^[A-Z]{3}$/, "Invalid City Code format. Please provide a 3-letter uppercase code, e.g., 'NYC'.");
    return airportsData.filter(airport => airport.city_code === cityCode);
}

function getAirportByCountryCode(countryCode) {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    return airportsData.filter(airport => airport.country_code === countryCode);
}

function getAirportByContinent(continentCode) {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    return airportsData.filter(airport => airport.continent_code === continentCode);
}

// Initially load compressed JSON data
loadJSONData();

module.exports = {
    getAirportByIata,
    getAirportByIcao,
    getAirportByCityCode,
    getAirportByCountryCode,
    getAirportByContinent
};
