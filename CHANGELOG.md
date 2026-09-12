# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### 🗺️ Data updates

- **PBI → DJT** — Palm Beach International Airport's IATA/ICAO codes changed to `DJT`/`KDJT` (now "President Donald J. Trump International Airport"). Added as a new record; the original `PBI`/`KPBI` record is kept as a legacy alias so existing lookups keep working, with its name and website updated to match the airport's current branding. ([#164](https://github.com/aashishvanand/airport-data-js/issues/164))
- **PHH** — corrected: this IATA code was reassigned from Phan Thiet Airport to Pokhara International Airport (`VNPR`, Nepal); the record had a stale name, country, coordinates and timezone from the previous holder
- **AVR** — corrected: this IATA code was reassigned from Alverca Airport to Amravati Airport (`VAAM`, India); the record had a stale name, country, coordinates and timezone from the previous holder
- **CSW** — added: Cabo San Lucas International Airport, Mexico (`MMSL`). The dataset previously carried a broken record under IATA `CSL` that mixed this airport's ICAO code and Wikipedia link with an unrelated US Army heliport's name; that record has been replaced
- **LSG** — added: Leshan Airport, China
- **BFY** — added: Bengbu Tenghu Airport, China (`ZSBA`)
- **TVT** — added: Tashkent-Khumo International Airport, Uzbekistan (`UZTP`)

### 🐛 Fixes

- **`elevation_ft` corruption on 503 airports** — a stale join with flightradar24's internal airport ID had overwritten `elevation_ft` with that ID instead of the real elevation (e.g. `ABQ` showed `56992` ft instead of `5,355` ft). All 503 affected records restored from OurAirports/live data; 502 of the 503 corrupted values matched flightradar24's ID exactly, confirming the root cause.

## [3.1.0] - 2026-04-03

### 🆕 New Features

- **TypeScript rewrite** — Entire library converted from JavaScript to TypeScript with strict types, including test suite
- **Exported interfaces** — `Airport`, `AirportWithDistance`, `AirportFilters`, `AirportLinks`, `AirportCountryStats`, `AirportContinentStats`, `DistanceMatrix`, `SortBy` available for consumers
- **LLM tool definitions** — New `airport-data-js/tools` subpath export with JSON Schema definitions for all 22 functions, compatible with OpenAI function calling, Anthropic tool use, Vercel AI SDK, and LangChain

### 📦 Packaging

- Added `types` field pointing to `types/index.d.ts` for TypeScript consumers
- Added `exports` map with `./tools` subpath for LLM tool schema import
- Added `types/` directory to `files` whitelist for npm distribution
- Generated `.d.ts` declaration files with full JSDoc for all public functions and interfaces

### 📖 Documentation

- Added `@example` blocks with runnable TypeScript snippets to all 22 public functions
- Per-field JSDoc comments on all exported interfaces
- Rich descriptions on tool definitions written as LLM-optimized prompts

### 🔧 Build

- Added `tsconfig.json` with strict mode, ESNext module output, and declaration generation
- Added `ts-loader` for webpack TypeScript compilation
- Added `webpack.tools.cjs` for standalone tools bundle
- Added `build:types` and `build:tools` scripts
- Updated `webpack.node.cjs` and `webpack.browser.cjs` for `.ts` entry points

### 🔄 Dependencies

- Added `typescript` ^5.7.3
- Added `ts-loader` ^9.5.1
- Added `ts-jest` ^29.4.9 and `@types/jest` ^30.0.0

### ⚠️ Migration Notes

- **No breaking API changes** — all 22 functions have identical signatures and behavior
- **No runtime changes** — the built `lib/index.js` and `dist/airport-data.min.js` output is functionally identical
- TypeScript consumers now get full type inference and autocompletion automatically
- JavaScript consumers are unaffected — no changes needed

## [3.0.2] - 2026-03-11

### 🚀 Performance

- Added lazy-loaded lookup indices for country, continent, timezone, and type fields for O(1) access
- Pre-computed geographic data (parsed lat/lon) to avoid repeated `parseFloat` calls in spatial queries
- Optimized `getAirportByRadius` with bounding-box pre-filtering to skip expensive Haversine calculations
- Extracted standalone `haversineDistance` helper with `DEG_TO_RAD` constant for faster math

### 🔒 Data Integrity

- All public API functions now return shallow copies of airport objects to prevent mutation of cached data
- Added comprehensive input validation across all public functions

### 📦 Packaging

- Set `main` to `lib/index.js` (Node CJS) and added `browser` field for `dist/airport-data.min.js`
- Added explicit `files` whitelist (`lib/`, `dist/`, `LICENSE`, `README.md`) for leaner npm package
- Removed `.npmignore` in favour of the `files` field
- Updated project homepage to `https://airportdata.dev/`

### 🔄 Dependencies

- Bumped `@babel/core` to 7.29.0, `@babel/preset-env` to 7.29.0
- Bumped `webpack` to 5.105.4, `fs-extra` to 11.3.4, `countries-list` to 3.3.0
- Bumped GitHub Actions: `actions/checkout` 6.0.2, `actions/setup-node` 6.3.0, `actions/upload-artifact` 7.0.0, `github/codeql-action` 4.32.5

## [3.0.1] - 2026-01-24

### 🔄 Improvements

- Airport data update Jan 2026

### [3.0.0] - 2025-12-05

#### 🆕 New Features

- **`getAirportStatsByCountry(countryCode)`** - Get comprehensive statistics for airports in a country
- **`getAirportStatsByContinent(continentCode)`** - Get comprehensive statistics for airports on a continent
- **`getLargestAirportsByContinent(continentCode, limit, sortBy)`** - Get largest airports by runway or elevation
- **`getMultipleAirports(codes)`** - Bulk fetch multiple airports in one call
- **`calculateDistanceMatrix(codes)`** - Calculate distances between all pairs of airports
- **`findNearestAirport(lat, lon, filters)`** - Find single nearest airport with optional filters
- **`validateIataCode(code)`** - Validate IATA code existence
- **`validateIcaoCode(code)`** - Validate ICAO code existence
- **`getAirportCount(filters)`** - Get count of airports matching filters
- **`isAirportOperational(code)`** - Check if airport has scheduled service

#### 🔄 Improvements

- Enhanced bulk operations for better performance
- Added comprehensive statistical analysis capabilities
- Improved validation utilities for code checking
- Better support for route planning and analysis
- Professional build pipeline with duplicate checking
- Automated release notes from changelog

## [2.0.0] - 2024-07-24

### 🆕 New Features

- **`getAirportsByTimezone(timezone)`** - Find airports by timezone
- **`getAirportLinks(code)`** - Get external links for airports
- **`findAirports(filters)`** - Advanced multi-criteria filtering
- **`getAutocompleteSuggestions(query)`** - Autocomplete functionality
- **Enhanced `getAirportsByType(type)`** - Now supports convenience search for "airport" type
- **External links support** - Wikipedia, websites, and flight tracking URLs
- **Timezone information** - Complete timezone data for all airports
- **Runway length data** - Airport runway information included
- **Scheduled service indicator** - Whether airports have commercial scheduled service

### 🔄 Improvements

- Better error handling and validation
- More comprehensive airport data structure
- Improved type filtering with partial matching
- Enhanced geographic calculations
- Case-insensitive search improvements

### ❌ Breaking Changes

- Legacy data format no longer supported
- Simplified airport objects expanded to include more fields
- Basic filtering replaced with advanced `findAirports` function

## [1.0.6] - 2022-11-24

### 🔄 Improvements

- Data updates

## [1.0.5] - 2022-11-20

### 🔄 Improvements

- Data updates

## [1.0.4] - 2022-11-18

### 🔄 Improvements

- Data updates

## [1.0.3] - 2022-11-15

### 🔄 Improvements

- Data updates

## [1.0.2] - 2022-11-12

### 🔄 Improvements

- Data updates

## [1.0.1] - 2022-11-10

### 🐛 Bug Fixes

- Fixed initial release issues
- Improved error handling

## [1.0.0] - 2022-11-08

### 🆕 Initial Release

- Basic airport lookup by IATA and ICAO codes
- Search by country and continent
