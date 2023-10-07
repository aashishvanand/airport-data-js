let airportsData = [];

function isNodeEnvironment() {
    return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
}

async function loadData() {
    if (isNodeEnvironment()) {
        // Node.js context
        const fs = require('fs');
        const path = require('path');
        const pako = require('pako');

        const chunkCount = 17;

        for (let i = 0; i < chunkCount; i++) {
            const chunkBuffer = fs.readFileSync(path.join(__dirname, `airports_chunk_${i}.bin`));
            const chunkData = new Uint8Array(chunkBuffer);
            const chunkJson = JSON.parse(pako.inflate(chunkData, { to: 'string' }));
            airportsData = airportsData.concat(chunkJson);
        }
    } else {
        // Browser context, use dynamic imports
        const chunks = [];
        for (let i = 0; i <= 6; i++) {
            chunks.push(import(`./airports_chunk_${i}.bin`));
        }
        Promise.all(chunks).then(data => {
            data.forEach(chunk => {
                airportsData = airportsData.concat(JSON.parse(pako.inflate(chunk.default, { to: 'string' }))); // Assuming pako is globally available in the browser
            });
        });
    }
}

loadData();

function validateRegex(data, regex, errorMessage) {
    if (!regex.test(data)) {
        throw new Error(errorMessage);
    }
}

async function getAirportByIata(iataCode = '') {
    validateRegex(iataCode, /^[A-Z]{3}$/, "Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'.");
    const results = airportsData.filter(airport => airport.iata === iataCode);
    if (results.length === 0) {
        throw new Error(`No data found for IATA code: ${iataCode}`);
    }
    return results;
}

async function getAirportByIcao(icaoCode = '') {
    validateRegex(icaoCode, /^[A-Z0-9]{4}$/, "Invalid ICAO format. Please provide a 4-character uppercase code, e.g., 'NTGA'.");
    const results = airportsData.filter(airport => airport.icao === icaoCode);
    if (results.length === 0) {
        throw new Error(`No data found for ICAO code: ${icaoCode}`);
    }
    return results;
}

async function getAirportByCityCode(cityCode = '') {
    validateRegex(cityCode, /^[A-Z]{3}$/, "Invalid City Code format. Please provide a 3-letter uppercase code, e.g., 'NYC'.");
    const results = airportsData.filter(airport => airport.city_code === cityCode);
    if (results.length === 0) {
        throw new Error(`No data found for City Code: ${cityCode}`);
    }
    return results;
}

async function getAirportByCountryCode(countryCode = '') {
    validateRegex(countryCode, /^[A-Z]{2}$/, "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'.");
    const results = airportsData.filter(airport => airport.country_code === countryCode);
    if (results.length === 0) {
        throw new Error(`No data found for Country Code: ${countryCode}`);
    }
    return results;
}

async function getAirportByContinent(continentCode = '') {
    validateRegex(continentCode, /^[A-Z]{2}$/, "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'.");
    const results = airportsData.filter(airport => airport.continent === continentCode);
    if (results.length === 0) {
        throw new Error(`No data found for Continent Code: ${continentCode}`);
    }
    return results;
}

module.exports = {
    getAirportByIata,
    getAirportByIcao,
    getAirportByCityCode,
    getAirportByCountryCode,
    getAirportByContinent
};
