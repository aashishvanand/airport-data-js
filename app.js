global.self = global;
const axios = require('axios');
const { getAirportByIata } = require('airport-data-js');

async function fetchAirportData(iataCode) {
    try {
        const airportData = getAirportByIata(iataCode);
        console.log(airportData);
    } catch (error) {
        console.error('Error fetching airport data:', error.message);
    }
}

fetchAirportData('MAA');
fetchSomeExternalData();
