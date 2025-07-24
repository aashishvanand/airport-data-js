# Airport Data React Sample v2.0.0

This project is a React application that demonstrates the usage of the `airport-data-js` library v2.0.0. It provides a comprehensive interface for searching airport information using various criteria and showcases all the new features introduced in the latest version.

## 🚀 New Features in v2.0.0

### Enhanced Search Capabilities
- **Multiple Search Types**: IATA, ICAO, name, country, continent, type, and timezone-based searches
- **Autocomplete Suggestions**: Real-time search suggestions for airport names
- **Advanced Filtering**: Multi-criteria filtering with country, type, continent, runway length, and scheduled service filters

### Geographic Features
- **Nearby Airport Search**: Find airports within a specified radius of coordinates
- **Distance Calculator**: Calculate great-circle distances between any two airports
- **Interactive Map**: Enhanced map visualization with flight-themed markers

### Enhanced Data Display
- **External Links**: Direct links to Wikipedia, airport websites, and flight tracking services
- **Comprehensive Airport Details**: Timezone, runway length, elevation, scheduled service status
- **Responsive Cards**: Modern card-based layout with improved information density

## Getting Started

### Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js 18+ and npm/yarn
- Basic understanding of React.js and Next.js

### Installation

1. Clone the repository or download the ZIP file to your local machine
2. Navigate to the project directory
3. Install the dependencies:

```bash
npm install
```

### Update to v2.0.0

Update your `package.json` to use the latest version:

```json
{
  "dependencies": {
    "airport-data-js": "^2.0.0"
  }
}
```

Then run:
```bash
npm install
```

## Usage

To start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## New API Integration Examples

### Enhanced Search Functions

```javascript
import {
  getAirportByIata,
  getAirportByIcao,
  searchByName,
  getAirportByCountryCode,
  getAirportByContinent,
  getAirportsByType,
  getAirportsByTimezone,
  findNearbyAirports,
  calculateDistance,
  getAutocompleteSuggestions,
  getAirportLinks,
  findAirports
} from 'airport-data-js';
```

### Basic Airport Search

```javascript
// Search by IATA code
const airports = await getAirportByIata('SIN');
console.log(airports[0].airport); // "Singapore Changi Airport"

// Search by name with autocomplete
const suggestions = await getAutocompleteSuggestions('Singapore');
console.log(suggestions); // Array of airport suggestions

// Search by timezone
const londonAirports = await getAirportsByTimezone('Europe/London');
```

### Geographic Operations

```javascript
// Find airports within 100km of coordinates
const nearby = await findNearbyAirports(1.35019, 103.994003, 100);

// Calculate distance between airports
const distance = await calculateDistance('SIN', 'LHR');
console.log(`Distance: ${Math.round(distance)} km`);
```

### Advanced Filtering

```javascript
// Multi-criteria search
const largeAsianAirports = await findAirports({
  continent: 'AS',
  type: 'large_airport',
  has_scheduled_service: true,
  min_runway_ft: 10000
});
```

### External Links Integration

```javascript
// Get external links for an airport
const links = await getAirportLinks('SIN');
console.log(links.website); // "https://www.changiairport.com"
console.log(links.wikipedia); // Wikipedia URL
console.log(links.flightradar24); // FlightRadar24 URL
```

## Application Features

### 1. Enhanced Search Interface
- **Tabbed Search Types**: Easy switching between different search criteria
- **Input Validation**: Real-time validation for different code formats
- **Autocomplete**: Smart suggestions for airport name searches
- **Loading States**: Clear feedback during search operations

### 2. Distance Calculator
- Calculate distances between any two airports using IATA or ICAO codes
- Results displayed in both kilometers and miles
- Great-circle distance calculation for accuracy

### 3. Nearby Airport Finder
- Interactive coordinate input with decimal precision
- Adjustable search radius (10-500 km)
- Visual representation on the map

### 4. Advanced Filtering
- **Country Filter**: Search by 2-letter country codes
- **Airport Type Filter**: Filter by large/medium/small airports, heliports, seaplane bases
- **Continent Filter**: Filter by continent (AS, EU, NA, SA, AF, OC, AN)
- **Runway Length Filter**: Minimum runway length slider
- **Scheduled Service Toggle**: Filter airports with commercial scheduled service

### 5. Interactive Map
- **Enhanced Markers**: Custom flight-themed icons
- **Dark/Light Mode Support**: Map tiles adapt to theme
- **Detailed Popups**: Comprehensive airport information in map popups
- **Responsive Zoom**: Automatic zoom adjustment based on search results

### 6. Modern Airport Cards
- **Comprehensive Information**: All new v2.0.0 data fields displayed
- **External Links**: Direct access to airport websites and flight tracking
- **Responsive Design**: Optimal layout on all screen sizes
- **Visual Indicators**: Clear status indicators for scheduled service

## Enhanced Data Structure

The v2.0.0 airport objects now include:

```javascript
{
  iata: "SIN",                    // 3-letter IATA code
  icao: "WSSS",                   // 4-letter ICAO code
  time: "Asia/Singapore",         // Timezone identifier
  country_code: "SG",             // 2-letter country code
  continent: "AS",                // 2-letter continent code
  airport: "Singapore Changi Airport",
  latitude: "1.35019",
  longitude: "103.994003",
  elevation: "22",                // Elevation in feet
  type: "large_airport",          // Airport classification
  scheduled_service: true,        // Commercial service availability
  wikipedia: "https://...",       // Wikipedia link
  website: "https://...",         // Official website
  runway_length: "13200",         // Longest runway in feet
  flightradar24_url: "https://...", // Flight tracking links
  radarbox_url: "https://...",
  flightaware_url: "https://..."
}
```

## Error Handling

The application includes comprehensive error handling:
- Input validation with real-time feedback
- Network error handling with user-friendly messages
- Graceful fallbacks for missing data
- Loading states for better user experience

## Performance Optimizations

- **Debounced Autocomplete**: Reduces API calls during typing
- **Result Limiting**: Shows first 20 results with pagination info
- **Efficient Re-renders**: Optimized state management
- **Lazy Loading**: Map components loaded only when needed

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Support for dark/light themes
- **Focus Management**: Clear focus indicators

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

To contribute to the Airport Data React Sample:

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Create a pull request

## Changelog

### Version 2.0.0
- ✨ Added support for all new airport-data-js v2.0.0 features
- ✨ Enhanced search with autocomplete functionality
- ✨ Advanced multi-criteria filtering
- ✨ Distance calculation between airports
- ✨ Nearby airport search with radius control
- ✨ External links integration (Wikipedia, websites, flight tracking)
- ✨ Timezone-based airport search
- ✨ Runway length and elevation data display
- ✨ Scheduled service indicators
- 🎨 Modern card-based UI design
- 🎨 Enhanced map visualization with custom markers
- 🔧 Improved error handling and loading states
- 🔧 Performance optimizations and accessibility improvements

### Version 1.x
- Basic IATA/ICAO search functionality
- Simple map integration
- Basic airport information display

## License

This project is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) - see the [LICENSE](LICENSE) file for details.

## Dependencies

### Core Dependencies
```json
{
  "airport-data-js": "^2.0.0",
  "next": "^14.2.15",
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

### UI and Styling
```json
{
  "@emotion/react": "^11.13.3",
  "@emotion/styled": "^11.13.0",
  "@mui/icons-material": "^6.1.3",
  "@mui/material": "^6.1.3",
  "next-themes": "^0.3.0"
}
```

### Map Integration
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1"
}
```

### Analytics (Optional)
```json
{
  "react-microsoft-clarity": "^1.2.0"
}
```

## Development Setup

### Environment Setup
1. Ensure Node.js 18+ is installed
2. Clone the repository
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

### Building for Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on commits to main branch

### Other Platforms
- **Netlify**: Compatible with static export
- **GitHub Pages**: Use `next export` for static deployment
- **Docker**: Dockerfile included for containerized deployment

## API Reference

For complete API documentation of the airport-data-js library, visit:
- [GitHub Repository](https://github.com/aashishvanand/airport-data-js)
- [NPM Package](https://www.npmjs.com/package/airport-data-js)

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/aashishvanand/airport-data-js/issues) page
2. Create a new issue with detailed information
3. Include browser version, Node.js version, and steps to reproduce

## Migration Guide from v1.x

### Breaking Changes
- Airport data structure has been expanded with new fields
- Some function signatures have changed for consistency
- New required dependencies for enhanced features

### Migration Steps
1. Update `airport-data-js` to v2.0.0
2. Update your imports to include new functions
3. Review and update any custom airport data handling
4. Test all existing functionality with new data structure

### Code Changes Required
```javascript
// Old v1.x approach
import { getAirportByIata } from 'airport-data-js';
const airport = await getAirportByIata('SIN');

// New v2.0.0 approach (backwards compatible)
import { getAirportByIata } from 'airport-data-js';
const airports = await getAirportByIata('SIN'); // Returns array
const airport = airports[0]; // Get first result
```

## Roadmap

### Upcoming Features
- [ ] Bulk airport data export functionality
- [ ] Advanced route planning between multiple airports
- [ ] Airport weather integration
- [ ] Flight schedule integration
- [ ] 3D airport terminal maps
- [ ] Offline mode support
- [ ] Progressive Web App (PWA) features

### Performance Improvements
- [ ] Virtual scrolling for large result sets
- [ ] Map clustering for dense airport areas
- [ ] Service worker for caching
- [ ] GraphQL integration for optimized queries

## Community

- **GitHub Discussions**: Share ideas and ask questions
- **Twitter**: Follow updates [@airportdatajs](https://twitter.com/airportdatajs)
- **Discord**: Join our developer community

## Acknowledgments

- Airport data provided by [OurAirports](https://ourairports.com/)
- Map tiles by [OpenStreetMap](https://openstreetmap.org/) and [CartoDB](https://carto.com/)
- Icons by [Material-UI](https://mui.com/)
- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)

## Related Projects

- [airport-data-js](https://github.com/aashishvanand/airport-data-js) - The core library
- [airport-api](https://github.com/aashishvanand/airport-api) - REST API wrapper
- [airport-cli](https://github.com/aashishvanand/airport-cli) - Command-line interface

---

**Made with ✈️ by the Airport Data JS team**