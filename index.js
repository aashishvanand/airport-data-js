const fs = require('fs');
const zlib = require('zlib');

let airportsData = [];

// Load compressed JSON data into memory
function loadJSONData() {
    if (airportsData.length) return;

    const compressedData = fs.readFileSync('./data/airports.json.gz');
    const rawData = zlib.gunzipSync(compressedData).toString();
    airportsData = JSON.parse(rawData);
}

function getAirportByIata(iataCode) {
    return airportsData.filter(airport => airport.iata === iataCode);
}

function getAirportByIcao(icaoCode) {
    return airportsData.filter(airport => airport.icao === icaoCode);
}

function getAirportByCityCode(cityCode) {
    return airportsData.filter(airport => airport.city_code === cityCode);
}

function getAirportByCountryCode(countryCode) {
    return airportsData.filter(airport => airport.country_code === countryCode);
}

function getAirportByContinent(continentCode) {
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
