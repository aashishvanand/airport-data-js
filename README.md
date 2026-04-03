# Airport Data JS

A comprehensive JavaScript library for retrieving airport information by IATA codes, ICAO codes, and various other criteria. This library provides easy access to a large dataset of airports worldwide with detailed information including coordinates, timezone, type, and external links.

## Installation

```bash
npm install airport-data-js
```

## Features

- 🌍 Comprehensive airport database with worldwide coverage
- 🔍 Search by IATA codes, ICAO codes, country, continent, and more
- 📍 Geographic proximity search with customizable radius
- 🔗 External links to Wikipedia, airport websites, and flight tracking services
- 📏 Distance calculation between airports
- 🏷️ Filter by airport type (large_airport, medium_airport, small_airport, heliport, seaplane_base)
- 🕒 Timezone-based airport lookup
- 💡 Autocomplete suggestions for search interfaces
- 🎯 Advanced multi-criteria filtering
- 📊 Statistical analysis by country and continent
- 🔢 Bulk operations for multiple airports
- ✅ Code validation utilities
- 🎚️ Airport ranking by runway length and elevation

## Airport Data Structure

Each airport object contains the following fields:

```javascript
{
  iata: "SIN",                    // 3-letter IATA code
  icao: "WSSS",                   // 4-letter ICAO code
  time: "Asia/Singapore",         // Timezone identifier
  country_code: "SG",             // 2-letter country code
  continent: "AS",                // 2-letter continent code (AS, EU, NA, SA, AF, OC, AN)
  airport: "Singapore Changi Airport",  // Airport name
  latitude: "1.35019",            // Latitude coordinate
  longitude: "103.994003",        // Longitude coordinate
  elevation: "22",                // Elevation in feet
  type: "large_airport",          // Airport type
  scheduled_service: true,        // Has scheduled commercial service
  wikipedia: "https://en.wikipedia.org/wiki/Singapore_Changi_Airport",
  website: "https://www.changiairport.com",
  runway_length: "13200",         // Longest runway in feet
  flightradar24_url: "https://www.flightradar24.com/airport/SIN",
  radarbox_url: "https://www.radarbox.com/airport/WSSS",
  flightaware_url: "https://www.flightaware.com/live/airport/WSSS"
}
```

## Basic Usage

```javascript
const {
  getAirportByIata,
  getAirportByIcao,
  searchByName,
  findNearbyAirports
} = require('airport-data-js');

// Get airport by IATA code
const [airport] = await getAirportByIata('SIN');
console.log(airport.airport); // "Singapore Changi Airport"

// Get airport by ICAO code
const [airport] = await getAirportByIcao('WSSS');
console.log(airport.country_code); // "SG"

// Search airports by name
const airports = await searchByName('Singapore');
console.log(airports.length); // Multiple airports matching "Singapore"

// Find nearby airports (within 50km of coordinates)
const nearby = await findNearbyAirports(1.35019, 103.994003, 50);
console.log(nearby); // Airports near Singapore Changi
```

## API Reference

### Core Search Functions

#### `getAirportByIata(iataCode)`
Finds airports by their 3-letter IATA code.

```javascript
const airports = await getAirportByIata('LHR');
// Returns array of airports with IATA code 'LHR'
```

#### `getAirportByIcao(icaoCode)`
Finds airports by their 4-character ICAO code.

```javascript
const airports = await getAirportByIcao('EGLL');
// Returns array of airports with ICAO code 'EGLL'
```

#### `searchByName(query)`
Searches for airports by name (case-insensitive, minimum 2 characters).

```javascript
const airports = await searchByName('Heathrow');
// Returns airports with 'Heathrow' in their name
```

### Geographic Functions

#### `findNearbyAirports(lat, lon, radiusKm)`
Finds airports within a specified radius of given coordinates.

```javascript
const nearby = await findNearbyAirports(51.5074, -0.1278, 100);
// Returns airports within 100km of London coordinates
```

#### `calculateDistance(code1, code2)`
Calculates the great-circle distance between two airports using IATA or ICAO codes.

```javascript
const distance = await calculateDistance('LHR', 'JFK');
// Returns distance in kilometers (approximately 5540)
```

### Filtering Functions

#### `getAirportByCountryCode(countryCode)`
Finds all airports in a specific country.

```javascript
const usAirports = await getAirportByCountryCode('US');
// Returns all airports in the United States
```

#### `getAirportByContinent(continentCode)`
Finds all airports on a specific continent.

```javascript
const asianAirports = await getAirportByContinent('AS');
// Returns all airports in Asia
// Continent codes: AS, EU, NA, SA, AF, OC, AN
```

#### `getAirportsByType(type)`
Finds airports by their type.

```javascript
const largeAirports = await getAirportsByType('large_airport');
// Available types: large_airport, medium_airport, small_airport, heliport, seaplane_base

// Convenience search for all airports
const allAirports = await getAirportsByType('airport');
// Returns large_airport, medium_airport, and small_airport
```

#### `getAirportsByTimezone(timezone)`
Finds all airports within a specific timezone.

```javascript
const londonAirports = await getAirportsByTimezone('Europe/London');
// Returns airports in London timezone
```

### Advanced Functions

#### `findAirports(filters)`
Finds airports matching multiple criteria.

```javascript
// Find large airports in Great Britain with scheduled service
const airports = await findAirports({
  country_code: 'GB',
  type: 'large_airport',
  has_scheduled_service: true
});

// Find airports with minimum runway length
const longRunwayAirports = await findAirports({
  min_runway_ft: 10000
});
```

#### `getAutocompleteSuggestions(query)`
Provides autocomplete suggestions for search interfaces (returns max 10 results).

```javascript
const suggestions = await getAutocompleteSuggestions('Lon');
// Returns up to 10 airports matching 'Lon' in name or IATA code
```

#### `getAirportLinks(code)`
Gets external links for an airport using IATA or ICAO code.

```javascript
const links = await getAirportLinks('SIN');
// Returns:
// {
//   website: "https://www.changiairport.com",
//   wikipedia: "https://en.wikipedia.org/wiki/Singapore_Changi_Airport",
//   flightradar24: "https://www.flightradar24.com/airport/SIN",
//   radarbox: "https://www.radarbox.com/airport/WSSS",
//   flightaware: "https://www.flightaware.com/live/airport/WSSS"
// }
```

### Statistical & Analytical Functions

#### `getAirportStatsByCountry(countryCode)`
Gets comprehensive statistics about airports in a specific country.

```javascript
const stats = await getAirportStatsByCountry('US');
// Returns:
// {
//   total: 5432,
//   byType: {
//     large_airport: 139,
//     medium_airport: 467,
//     small_airport: 4826
//   },
//   withScheduledService: 606,
//   averageRunwayLength: 5234,
//   averageElevation: 1245,
//   timezones: ['America/New_York', 'America/Chicago', ...]
// }
```

#### `getAirportStatsByContinent(continentCode)`
Gets comprehensive statistics about airports on a specific continent.

```javascript
const stats = await getAirportStatsByContinent('AS');
// Returns statistics including count by type, by country, 
// scheduled service count, average runway length, elevation, and timezones
```

#### `getLargestAirportsByContinent(continentCode, limit, sortBy)`
Gets the largest airports on a continent by runway length or elevation.

```javascript
// Get top 5 airports in Asia by runway length
const airports = await getLargestAirportsByContinent('AS', 5, 'runway');

// Get top 10 airports in South America by elevation
const highAltitude = await getLargestAirportsByContinent('SA', 10, 'elevation');
```

### Bulk Operations

#### `getMultipleAirports(codes)`
Fetches multiple airports by their IATA or ICAO codes in one call.

```javascript
const airports = await getMultipleAirports(['SIN', 'LHR', 'JFK', 'WSSS']);
// Returns array of airport objects (null for codes not found)
// Efficiently fetches multiple airports at once
```

#### `calculateDistanceMatrix(codes)`
Calculates distances between all pairs of airports in a list.

```javascript
const matrix = await calculateDistanceMatrix(['SIN', 'LHR', 'JFK']);
// Returns:
// {
//   airports: [
//     { code: 'SIN', name: 'Singapore Changi Airport', iata: 'SIN', icao: 'WSSS' },
//     { code: 'LHR', name: 'London Heathrow Airport', iata: 'LHR', icao: 'EGLL' },
//     { code: 'JFK', name: 'John F Kennedy International Airport', iata: 'JFK', icao: 'KJFK' }
//   ],
//   distances: {
//     SIN: { SIN: 0, LHR: 10872, JFK: 15344 },
//     LHR: { SIN: 10872, LHR: 0, JFK: 5540 },
//     JFK: { SIN: 15344, LHR: 5540, JFK: 0 }
//   }
// }
```

#### `findNearestAirport(lat, lon, filters)`
Finds the single nearest airport to given coordinates, optionally with filters.

```javascript
// Find nearest airport to coordinates
const nearest = await findNearestAirport(1.35019, 103.994003);
// Returns airport object with additional 'distance' field in km

// Find nearest large airport with scheduled service
const nearestHub = await findNearestAirport(1.35019, 103.994003, {
  type: 'large_airport',
  has_scheduled_service: true
});
```

### Validation & Utilities

#### `validateIataCode(code)`
Validates if an IATA code exists in the database.

```javascript
const isValid = await validateIataCode('SIN'); // true
const isInvalid = await validateIataCode('XYZ'); // false
const isBadFormat = await validateIataCode('ABCD'); // false
```

#### `validateIcaoCode(code)`
Validates if an ICAO code exists in the database.

```javascript
const isValid = await validateIcaoCode('WSSS'); // true
const isInvalid = await validateIcaoCode('XXXX'); // false
```

#### `getAirportCount(filters)`
Gets the count of airports matching the given filters without fetching all data.

```javascript
// Get total airport count
const total = await getAirportCount();

// Get count of large airports in the US
const count = await getAirportCount({
  country_code: 'US',
  type: 'large_airport'
});
```

#### `isAirportOperational(code)`
Checks if an airport has scheduled commercial service.

```javascript
const operational = await isAirportOperational('SIN'); // true
const notOperational = await isAirportOperational('SOME_SMALL_AIRPORT'); // false
```

## Error Handling

All functions return promises and may throw errors for invalid input or when no data is found.

```javascript
try {
  const airport = await getAirportByIata('XYZ');
} catch (error) {
  console.error(error.message); // "No data found for IATA code: XYZ"
}
```

## Examples

### Find airports near a city
```javascript
// Find airports within 100km of Paris
const parisAirports = await findNearbyAirports(48.8566, 2.3522, 100);
console.log(`Found ${parisAirports.length} airports near Paris`);
```

### Get flight distance
```javascript
// Calculate distance between Singapore and London
const distance = await calculateDistance('SIN', 'LHR');
console.log(`Distance: ${Math.round(distance)} km`);
```

### Build an airport search interface
```javascript
// Get autocomplete suggestions
const suggestions = await getAutocompleteSuggestions('New York');
suggestions.forEach(airport => {
  console.log(`${airport.iata} - ${airport.airport}`);
});
```

### Filter airports by multiple criteria
```javascript
// Find large airports in Asia with scheduled service
const asianHubs = await findAirports({
  continent: 'AS',
  type: 'large_airport',
  has_scheduled_service: true
});
```

### Get airport statistics
```javascript
// Get comprehensive statistics for US airports
const usStats = await getAirportStatsByCountry('US');
console.log(`Total airports: ${usStats.total}`);
console.log(`Large airports: ${usStats.byType.large_airport}`);
console.log(`Average runway length: ${usStats.averageRunwayLength} ft`);

// Get statistics for Asian airports
const asiaStats = await getAirportStatsByContinent('AS');
console.log(`Countries with airports: ${Object.keys(asiaStats.byCountry).length}`);
```

### Bulk operations
```javascript
// Fetch multiple airports at once
const airports = await getMultipleAirports(['SIN', 'LHR', 'JFK', 'NRT']);
airports.forEach(airport => {
  if (airport) {
    console.log(`${airport.iata}: ${airport.airport}`);
  }
});

// Calculate distance matrix for route planning
const matrix = await calculateDistanceMatrix(['SIN', 'LHR', 'JFK']);
console.log(`Distance from SIN to LHR: ${matrix.distances.SIN.LHR} km`);
console.log(`Distance from LHR to JFK: ${matrix.distances.LHR.JFK} km`);
```

### Validation utilities
```javascript
// Validate airport codes before processing
const codes = ['SIN', 'XYZ', 'LHR', 'ABCD'];
for (const code of codes) {
  const isValid = await validateIataCode(code);
  console.log(`${code}: ${isValid ? 'Valid' : 'Invalid'}`);
}

// Check if airport is operational
const operational = await isAirportOperational('SIN');
console.log(`Singapore Changi is operational: ${operational}`);
```

### Find nearest airport
```javascript
// Find nearest airport to current location
const nearest = await findNearestAirport(1.35019, 103.994003);
console.log(`Nearest airport: ${nearest.airport} (${nearest.distance} km away)`);

// Find nearest large airport with scheduled service
const nearestHub = await findNearestAirport(1.35019, 103.994003, {
  type: 'large_airport',
  has_scheduled_service: true
});
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history and release notes.

## Data Source

This library uses a comprehensive dataset of worldwide airports with regular updates to ensure accuracy and completeness.

## License

This project is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/aashishvanand/airport-data-js/issues).

### Getting Started

```bash
# Clone the repository
git clone https://github.com/aashishvanand/airport-data-js.git
cd airport-data-js

# Install dependencies
npm install

# Run the test suite
npm test

# Build both Node.js and browser bundles
npm run build
```

### Project Structure

```
airport-data-js/
├── src/
│   ├── index.js                  # Library source code
│   └── airports.compressed       # Compressed airport dataset
├── lib/                          # Node.js CJS build output
├── dist/                         # Browser build output
├── data/
│   └── airports.json             # Raw airport data (source of truth)
├── scripts/
│   ├── compress_json.js          # Compresses airports.json for distribution
│   ├── check_duplicates.js       # Validates no duplicate IATA/ICAO codes
│   ├── extract_latest_changelog.js # Extracts changelog for GitHub releases
│   └── benchmark.js              # Performance benchmarks
├── tests/
│   └── index.test.js             # Jest test suite
├── webpack.node.cjs              # Webpack config for Node.js bundle
└── webpack.browser.cjs           # Webpack config for browser bundle
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run the Jest test suite |
| `npm run build` | Build both Node.js (`lib/`) and browser (`dist/`) bundles |
| `npm run build:lib` | Build only the Node.js bundle |
| `npm run build:dist` | Build only the browser bundle |
| `npm run check:duplicates` | Check for duplicate airport codes in the dataset |

### Development Workflow

1. **Create a branch** from `main` for your changes
2. **Make your changes** in `src/index.js` or `data/airports.json`
3. **Add or update tests** in `tests/index.test.js`
4. **Run tests** to make sure everything passes: `npm test`
5. **Build** to verify the bundles compile: `npm run build`
6. **Submit a pull request** against `main`

### Updating Airport Data

If you are adding or updating airport entries:

1. Edit `data/airports.json` directly
2. Run `npm run check:duplicates` to ensure no duplicate IATA/ICAO codes
3. Run `node scripts/compress_json.js` to regenerate the compressed dataset
4. Run `npm test` to verify the changes
5. Submit a pull request with both the JSON and compressed data changes

## Publishing a New Version

Releases are automated via the [release workflow](.github/workflows/release.yml). To publish a new version:

1. **Update the version** in `package.json` (follow [Semantic Versioning](https://semver.org/))
2. **Update `CHANGELOG.md`** with a new section for the version (follow [Keep a Changelog](https://keepachangelog.com/) format)
3. **Build and test locally** to confirm everything works:
   ```bash
   npm run build && npm test
   ```
4. **Commit your changes** to `main`
5. **Push or merge to the `release` branch** -- this triggers the CI pipeline which will:
   - Run tests across Node.js 20.x, 22.x, and 24.x
   - Run a security audit (`npm audit --audit-level=critical`)
   - Check for duplicate airport codes
   - Build the package
   - Compare the version in `package.json` against the published npm version
   - **Publish to npm** with provenance (if the version is new)
   - **Create a GitHub Release** with notes extracted from `CHANGELOG.md`

The workflow can also be triggered manually via `workflow_dispatch` from the Actions tab.

### Version Policy

- **Patch** (e.g., 3.0.1 -> 3.0.2): Data updates, bug fixes, performance improvements, dependency bumps
- **Minor** (e.g., 3.0.x -> 3.1.0): New functions or non-breaking feature additions
- **Major** (e.g., 3.x.x -> 4.0.0): Breaking API changes or data format changes
