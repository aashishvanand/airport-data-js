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

## Changelog

### Version 2.0.0 (Latest)

#### 🆕 New Features
- **`getAirportsByTimezone(timezone)`** - Find airports by timezone
- **`getAirportLinks(code)`** - Get external links for airports
- **`findAirports(filters)`** - Advanced multi-criteria filtering
- **`getAutocompleteSuggestions(query)`** - Autocomplete functionality
- **Enhanced `getAirportsByType(type)`** - Now supports convenience search for "airport" type
- **External links support** - Wikipedia, websites, and flight tracking URLs
- **Timezone information** - Complete timezone data for all airports
- **Runway length data** - Airport runway information included
- **Scheduled service indicator** - Whether airports have commercial scheduled service

#### 🔄 Improvements
- Better error handling and validation
- More comprehensive airport data structure
- Improved type filtering with partial matching
- Enhanced geographic calculations
- Case-insensitive search improvements

#### ❌ Removed from v1.x
- Legacy data format support
- Simplified airport objects (expanded to include more fields)
- Basic filtering (replaced with advanced `findAirports` function)

## Data Source

This library uses a comprehensive dataset of worldwide airports with regular updates to ensure accuracy and completeness.

## License

This project is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/aashishvanand/airport-data-js/issues).
