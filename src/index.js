import jsonpack from "jsonpack";
import compressedData from "./airports.compressed";

const airportsData = jsonpack.unpack(compressedData);

function validateRegex(data, regex, errorMessage) {
  if (!regex.test(data)) {
    throw new Error(errorMessage);
  }
}

function getAirportByIata(iataCode = "") {
  validateRegex(
    iataCode,
    /^[A-Z]{3}$/,
    "Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'."
  );
  const result = airportsData.find((airport) => airport.iata === iataCode);
  if (result === undefined) {
    throw new Error(`No data found for IATA code: ${iataCode}`);
  }
  return result;
}

function getAirportByIcao(icaoCode = "") {
  validateRegex(
    icaoCode,
    /^[A-Z0-9]{4}$/,
    "Invalid ICAO format. Please provide a 4-character uppercase code, e.g., 'NTGA'."
  );
  const result = airportsData.find((airport) => airport.icao === icaoCode);
  if (result === undefined) {
    throw new Error(`No data found for ICAO code: ${icaoCode}`);
  }
  return result;
}

function getAirportByCityCode(cityCode = "") {
  validateRegex(
    cityCode,
    /^[A-Z]{3}$/,
    "Invalid City Code format. Please provide a 3-letter uppercase code, e.g., 'NYC'."
  );
  const results = airportsData.filter(
    (airport) => airport.city_code === cityCode
  );
  if (results.length === 0) {
    throw new Error(`No data found for City Code: ${cityCode}`);
  }
  return results;
}

function getAirportByCountryCode(countryCode = "") {
  validateRegex(
    countryCode,
    /^[A-Z]{2}$/,
    "Invalid Country Code format. Please provide a 2-letter uppercase code, e.g., 'US'."
  );
  const results = airportsData.filter(
    (airport) => airport.country_code === countryCode
  );
  if (results.length === 0) {
    throw new Error(`No data found for Country Code: ${countryCode}`);
  }
  return results;
}

function getAirportByContinent(continentCode = "") {
  validateRegex(
    continentCode,
    /^[A-Z]{2}$/,
    "Invalid Continent Code format. Please provide a 2-letter uppercase code, e.g., 'AS'."
  );
  const results = airportsData.filter(
    (airport) => airport.continent === continentCode
  );
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
  getAirportByContinent,
};
