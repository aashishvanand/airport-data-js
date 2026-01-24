# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
