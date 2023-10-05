# airports-nodejs

A comprehensive library providing easy retrieval of airport data based on IATA, ICAO, city codes, country codes, and continents. Ideal for developers building applications related to aviation, travel, and geography.

## Features

- Retrieve airport data using IATA code.
- Retrieve airport data using ICAO code.
- Fetch data using city codes.
- Fetch data using country codes.
- Retrieve data based on continents.
- Built-in error handling for invalid input formats.
- Efficiently packaged with minimized and gzipped data.

## Installation

You can install `airports-nodejs` using npm:

```bash
npm install airports-nodejs
```

## Usage

Here's how you can use the library:

```javascript
const airportData = require('airports-nodejs');

// Retrieve airport data using IATA code
const airportByIATA = airportData.getAirportByIata("AAA");
console.log(airportByIATA);

// Retrieve airport data using ICAO code
const airportByICAO = airportData.getAirportByIcao("NTGA");
console.log(airportByICAO);

// Fetch data using city codes
const airportByCityCode = airportData.getAirportByCityCode("NYC");
console.log(airportByCityCode);

// Fetch data using country codes
const airportByCountryCode = airportData.getAirportByCountryCode("US");
console.log(airportByCountryCode);

// Retrieve data based on continents
const airportByContinent = airportData.getAirportByContinent("AS");
console.log(airportByContinent);
```

## Running the Project Locally

1. Clone the repository:

```bash
git clone https://github.com/aashishvanand/airports-nodejs.git
```

2. Change into the cloned directory:

```bash
cd airports-nodejs
```

3. Install the necessary dependencies:

```bash
npm install
```

4. To bundle the source code using Webpack:

```bash
npm run build
```

5. To run tests:

```bash
npm test
```

## License

This project is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/aashishvanand/airports-nodejs/issues).