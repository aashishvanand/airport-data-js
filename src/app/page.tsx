'use client'

import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Tab,
  Tabs,
  Box,
  Paper,
  IconButton,
  Card,
  CardContent,
  Chip,
  Autocomplete,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FlightIcon from '@mui/icons-material/Flight';
import MapIcon from '@mui/icons-material/Map';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import NearMeIcon from '@mui/icons-material/NearMe';
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
  getAirportLinks
} from 'airport-data-js';
import { useColorMode } from './providers';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

// Define types for better TypeScript support
interface Airport {
  iata: string;
  icao: string;
  airport: string;
  latitude: string | number;
  longitude: string | number;
  country_code: string;
  continent: string;
  type: string;
  time?: string;
  runway_length?: string;
  elevation?: string;
  scheduled_service?: boolean;
  website?: string;
  wikipedia?: string;
  flightradar24_url?: string;
  radarbox_url?: string;
  flightaware_url?: string;
  city?: string;
}

// Create custom flight icon for map markers
const createFlightIcon = (isDarkMode: boolean) => {
  if (typeof window === 'undefined') return null;
  const L = require('leaflet');
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isDarkMode ? '#ffffff' : '#000000'}" width="24px" height="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function UpdatedAirportSearch() {
  // State variables
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Airport[]>([]);
  const [error, setError] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [searchType, setSearchType] = useState<string>('iata');
  const [mapZoom, setMapZoom] = useState<number>(2);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [distanceResult, setDistanceResult] = useState<number | null>(null);
  const [distanceAirport1, setDistanceAirport1] = useState<string>('');
  const [distanceAirport2, setDistanceAirport2] = useState<string>('');
  const [distanceAirport1Data, setDistanceAirport1Data] = useState<Airport | null>(null);
  const [distanceAirport2Data, setDistanceAirport2Data] = useState<Airport | null>(null);
  const [nearbyLat, setNearbyLat] = useState<number>(1.35019);
  const [nearbyLon, setNearbyLon] = useState<number>(103.994003);
  const [nearbyRadius, setNearbyRadius] = useState<number>(50);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState<boolean>(false);
  
  const theme = useTheme();
  const colorMode = useColorMode();

  // Effect to load Leaflet CSS and set mounted state
  useEffect(() => {
    setMounted(true);
    const link = document.createElement('link');
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Autocomplete functionality for better UX
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2 && searchType === 'name') {
        try {
          const autocompleteSuggestions = await getAutocompleteSuggestions(query);
          setSuggestions(autocompleteSuggestions || []);
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  // Main search function with enhanced functionality
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const searchFunctions: Record<string, (query: string) => Promise<Airport[]>> = {
        iata: getAirportByIata,
        icao: getAirportByIcao,
        name: searchByName,
        country: getAirportByCountryCode,
        continent: getAirportByContinent,
        type: getAirportsByType,
        timezone: getAirportsByTimezone
      };

      const airportsResponse = await searchFunctions[searchType](query);
      const airports = Array.isArray(airportsResponse) ? airportsResponse : [airportsResponse].filter(Boolean);
      
      if (airports && airports.length > 0) {
        const validAirports = airports
          .filter(airport => airport && airport.latitude && airport.longitude)
          .map(airport => ({
            ...airport,
            latitude: parseFloat(airport.latitude.toString()),
            longitude: parseFloat(airport.longitude.toString())
          }))
          .filter(airport => !isNaN(airport.latitude as number) && !isNaN(airport.longitude as number));

        if (validAirports.length > 0) {
          setResults(validAirports);
          setMapCenter([validAirports[0].latitude as number, validAirports[0].longitude as number]);
          setMapZoom(validAirports.length === 1 ? 10 : 6);
          
          // Get external links for the first airport
          if (validAirports[0].iata || validAirports[0].icao) {
            try {
              const airportLinks = await getAirportLinks(validAirports[0].iata || validAirports[0].icao);
              setLinks(airportLinks || {});
            } catch (err) {
              console.error('Failed to fetch links:', err);
            }
          }
          setError('');
        } else {
          setResults([]);
          setError('No valid coordinates found for the airport(s).');
        }
      } else {
        setResults([]);
        setError(`No airports found for ${searchType}: ${query}`);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Distance calculation between two airports
  const handleCalculateDistance = async () => {
    if (!distanceAirport1 || !distanceAirport2) return;
    
    try {
      const distance = await calculateDistance(distanceAirport1, distanceAirport2);
      setDistanceResult(distance);
      
      // Fetch airport data for both airports to display on map
      try {
        const airport1Response = await (distanceAirport1.length === 3 ? 
          getAirportByIata(distanceAirport1) : 
          getAirportByIcao(distanceAirport1));
        const airport2Response = await (distanceAirport2.length === 3 ? 
          getAirportByIata(distanceAirport2) : 
          getAirportByIcao(distanceAirport2));
        
        const airport1Data = Array.isArray(airport1Response) ? airport1Response[0] : airport1Response;
        const airport2Data = Array.isArray(airport2Response) ? airport2Response[0] : airport2Response;
        
        if (airport1Data && airport2Data) {
          const processedAirport1 = {
            ...airport1Data,
            latitude: parseFloat(airport1Data.latitude.toString()),
            longitude: parseFloat(airport1Data.longitude.toString())
          };
          const processedAirport2 = {
            ...airport2Data,
            latitude: parseFloat(airport2Data.latitude.toString()),
            longitude: parseFloat(airport2Data.longitude.toString())
          };
          
          setDistanceAirport1Data(processedAirport1);
          setDistanceAirport2Data(processedAirport2);
          
          // Set map to show both airports
          const centerLat = ((processedAirport1.latitude as number) + (processedAirport2.latitude as number)) / 2;
          const centerLon = ((processedAirport1.longitude as number) + (processedAirport2.longitude as number)) / 2;
          setMapCenter([centerLat, centerLon]);
          setMapZoom(4);
          
          // Clear regular search results to show distance calculation
          setResults([processedAirport1, processedAirport2]);
        }
      } catch (err) {
        console.error('Failed to fetch airport data for distance calculation:', err);
      }
    } catch (err) {
      console.error('Distance calculation failed:', err);
      setDistanceResult(null);
    }
  };

  // Find airports near coordinates
  const handleNearbySearch = async () => {
    setLoading(true);
    setError('');
    try {
      const nearby = await findNearbyAirports(nearbyLat, nearbyLon, nearbyRadius);
      if (nearby && nearby.length > 0) {
        const validAirports = nearby
          .filter(airport => airport && airport.latitude && airport.longitude)
          .map(airport => ({
            ...airport,
            latitude: parseFloat(airport.latitude.toString()),
            longitude: parseFloat(airport.longitude.toString())
          }));
        setResults(validAirports);
        setMapCenter([nearbyLat, nearbyLon]);
        setMapZoom(8);
      } else {
        setResults([]);
        setError('No airports found in the specified area.');
      }
    } catch (err) {
      setError('Failed to find nearby airports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Render external links for airports
  const renderExternalLinks = (airport: Airport) => {
    const linkTypes = [
      { key: 'website', label: 'Website' },
      { key: 'wikipedia', label: 'Wikipedia' },
      { key: 'flightradar24_url', label: 'FlightRadar24' },
      { key: 'radarbox_url', label: 'RadarBox' },
      { key: 'flightaware_url', label: 'FlightAware' }
    ];

    const hasLinks = linkTypes.some(({ key }) => airport[key as keyof Airport] || links[key.replace('_url', '')]);

    if (!hasLinks) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>External Links</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {linkTypes.map(({ key, label }) => {
            const url = airport[key as keyof Airport] || links[key.replace('_url', '')];
            return url ? (
              <Chip
                key={key}
                label={label}
                component="a"
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ) : null;
          })}
        </Box>
      </Box>
    );
  };

  // Input validation based on search type
  const isValidInput = (): boolean => {
    if (!query) return false;
    const patterns: Record<string, RegExp> = {
      iata: /^[A-Z]{3}$/,
      icao: /^[A-Z]{4}$/,
      name: /^.{2,}$/,
      country: /^[A-Z]{2}$/,
      continent: /^[A-Z]{2}$/,
      type: /^.+$/,
      timezone: /^.+$/
    };
    return patterns[searchType]?.test(query) || false;
  };

  // Handle input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    const maxLengths: Record<string, number> = { iata: 3, icao: 4, country: 2, continent: 2 };
    if (maxLengths[searchType]) {
      setQuery(value.slice(0, maxLengths[searchType]));
    } else {
      setQuery(e.target.value); // Don't transform case for name/timezone searches
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <FlightIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Airport Search v2.0.0
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
        {/* Main Search Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Enhanced Airport Search
          </Typography>
          
          <Tabs 
            value={searchType} 
            onChange={(_, newValue) => setSearchType(newValue)} 
            sx={{ mb: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {['iata', 'icao', 'name', 'country', 'continent', 'type', 'timezone'].map(type => (
              <Tab key={type} label={type.toUpperCase()} value={type} />
            ))}
          </Tabs>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {searchType === 'name' && suggestions.length > 0 ? (
              <Autocomplete
                freeSolo
                options={suggestions}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : `${option.iata} - ${option.airport}`
                }
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">
                        <strong>{option.iata}</strong> - {option.airport}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.city}, {option.country_code}
                      </Typography>
                    </Box>
                  </li>
                )}
                inputValue={query}
                onInputChange={(_, newValue) => setQuery(newValue || '')}
                sx={{ flexGrow: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Search by ${searchType.toUpperCase()}`}
                    variant="outlined"
                    fullWidth
                    error={query.length > 0 && !isValidInput()}
                    helperText={query.length > 0 && !isValidInput() ? `Invalid ${searchType.toUpperCase()} format` : ''}
                  />
                )}
              />
            ) : (
              <TextField
                fullWidth
                label={`Enter ${searchType.toUpperCase()}`}
                variant="outlined"
                value={query}
                onChange={handleInputChange}
                error={query.length > 0 && !isValidInput()}
                helperText={query.length > 0 && !isValidInput() ? `Invalid ${searchType.toUpperCase()} format` : ''}
              />
            )}
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              disabled={loading || !isValidInput()}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>

        {/* Advanced Features */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Distance Calculator */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">✈️ Distance Calculator</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Airport 1 (IATA/ICAO)"
                    value={distanceAirport1}
                    onChange={(e) => setDistanceAirport1(e.target.value.toUpperCase())}
                    inputProps={{ maxLength: 4 }}
                  />
                  <TextField
                    label="Airport 2 (IATA/ICAO)"
                    value={distanceAirport2}
                    onChange={(e) => setDistanceAirport2(e.target.value.toUpperCase())}
                    inputProps={{ maxLength: 4 }}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleCalculateDistance}
                    disabled={!distanceAirport1 || !distanceAirport2}
                  >
                    Calculate Distance & Show Map
                  </Button>
                  {distanceResult && (
                    <Alert severity="info">
                      Distance: {Math.round(distanceResult)} km ({Math.round(distanceResult * 0.621371)} miles)
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Nearby Search */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  <NearMeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Nearby Airports
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Latitude"
                    type="number"
                    value={nearbyLat}
                    onChange={(e) => setNearbyLat(parseFloat(e.target.value) || 0)}
                    inputProps={{ step: 0.0001 }}
                  />
                  <TextField
                    label="Longitude"
                    type="number"
                    value={nearbyLon}
                    onChange={(e) => setNearbyLon(parseFloat(e.target.value) || 0)}
                    inputProps={{ step: 0.0001 }}
                  />
                  <Box>
                    <Typography gutterBottom>Radius: {nearbyRadius} km</Typography>
                    <Slider
                      value={nearbyRadius}
                      onChange={(_, newValue) => setNearbyRadius(newValue as number)}
                      min={10}
                      max={500}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Button variant="outlined" onClick={handleNearbySearch} disabled={loading}>
                    Find Nearby Airports
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>

        {/* Map Section */}
        {results.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {distanceAirport1Data && distanceAirport2Data ? 
                `Distance Calculation: ${distanceAirport1} ↔ ${distanceAirport2}` :
                `Airport Map (${results.length} airport${results.length !== 1 ? 's' : ''})`
              }
            </Typography>
            <Box sx={{ height: 400, width: '100%' }}>
              {typeof window !== 'undefined' && (
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url={theme.palette.mode === 'dark' 
                      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                  />
                  
                  {/* Regular airport markers */}
                  {results.map((airport, index) => (
                    airport.latitude && airport.longitude ? (
                      <Marker 
                        key={`${airport.iata}-${airport.icao}-${index}`}
                        position={[airport.latitude as number, airport.longitude as number] as LatLngTuple}
                        icon={createFlightIcon(theme.palette.mode === 'dark')}
                      >
                        <Popup>
                          <div>
                            <strong>{airport.airport}</strong><br />
                            <strong>IATA:</strong> {airport.iata}<br />
                            <strong>ICAO:</strong> {airport.icao}<br />
                            <strong>Type:</strong> {airport.type?.replace('_', ' ')}<br />
                            <strong>Country:</strong> {airport.country_code}<br />
                            {airport.runway_length && (
                              <>
                                <strong>Runway:</strong> {airport.runway_length} ft<br />
                              </>
                            )}
                            <strong>Scheduled Service:</strong> {airport.scheduled_service ? 'Yes' : 'No'}
                            {distanceResult && distanceAirport1Data && distanceAirport2Data && (
                              <>
                                <br /><br />
                                <strong>Distance:</strong> {Math.round(distanceResult)} km<br />
                                <strong>Distance:</strong> {Math.round(distanceResult * 0.621371)} miles
                              </>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ) : null
                  ))}
                  
                  {/* Distance line between airports */}
                  {distanceAirport1Data && distanceAirport2Data && distanceResult && (
                    <Polyline
                      positions={[
                        [distanceAirport1Data.latitude as number, distanceAirport1Data.longitude as number],
                        [distanceAirport2Data.latitude as number, distanceAirport2Data.longitude as number]
                      ]}
                      color={theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2'}
                      weight={3}
                      opacity={0.8}
                      dashArray="10, 10"
                    />
                  )}
                </MapContainer>
              )}
            </Box>
            
            {/* Distance calculation summary */}
            {distanceResult && distanceAirport1Data && distanceAirport2Data && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  ✈️ Flight Distance Calculation
                </Typography>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 4
                    }}>
                    <Typography variant="body2">
                      <strong>From:</strong> {distanceAirport1Data.airport} ({distanceAirport1Data.iata})
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 4
                    }}>
                    <Typography variant="body2">
                      <strong>To:</strong> {distanceAirport2Data.airport} ({distanceAirport2Data.iata})
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 4
                    }}>
                    <Typography variant="body2">
                      <strong>Great Circle Distance:</strong><br />
                      {Math.round(distanceResult)} km / {Math.round(distanceResult * 0.621371)} miles
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        )}

        {/* Enhanced Airport Details Cards */}
        {results.length > 0 && (
          <Grid container spacing={3}>
            {results.slice(0, 20).map((airport, index) => ( // Limit to first 20 results
              (<Grid
                key={`${airport.iata}-${airport.icao}-${index}`}
                size={{
                  xs: 12,
                  md: 6,
                  lg: 4
                }}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ 
                        fontSize: '1.1rem', 
                        lineHeight: 1.3,
                        fontWeight: 600,
                        color: 'primary.main'
                      }}>
                        {airport.airport}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip 
                          label={airport.iata} 
                          color="primary" 
                          size="small" 
                          sx={{ fontSize: '0.75rem', fontWeight: 600 }} 
                        />
                        <Chip 
                          label={airport.icao} 
                          color="secondary" 
                          size="small" 
                          sx={{ fontSize: '0.75rem', fontWeight: 600 }} 
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={`${airport.country_code} • ${airport.continent}`}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip 
                        label={airport.type?.replace('_', ' ') || 'Unknown'}
                        variant="outlined"
                        size="small"
                        color="info"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 1 }}>
                      {airport.city && (
                        <Typography component="div" variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                          <strong>City:</strong> 
                          <Box component="span" sx={{ ml: 1 }}>{airport.city}</Box>
                        </Typography>
                      )}
                      
                      {airport.time && (
                        <Typography component="div" variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                          <strong>Timezone:</strong> 
                          <Box component="span" sx={{ ml: 1 }}>{airport.time}</Box>
                        </Typography>
                      )}
                      
                      {airport.runway_length && (
                        <Typography component="div" variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                          <strong>Runway:</strong> 
                          <Box component="span" sx={{ ml: 1 }}>{airport.runway_length} ft</Box>
                        </Typography>
                      )}
                      
                      {airport.elevation && (
                        <Typography component="div" variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                          <strong>Elevation:</strong> 
                          <Box component="span" sx={{ ml: 1 }}>{airport.elevation} ft</Box>
                        </Typography>
                      )}
                      
                      <Typography component="div" variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                        <strong>Scheduled Service:</strong> 
                        <Box component="span" sx={{ ml: 1 }}>
                          {airport.scheduled_service ? (
                            <Chip label="Yes" color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="No" color="default" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </Typography>
                      
                      {airport.latitude && airport.longitude && (
                        <Typography component="div" variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                          <strong>Coordinates:</strong> 
                          <Box component="span" sx={{ ml: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {(airport.latitude as number).toFixed(4)}, {(airport.longitude as number).toFixed(4)}
                          </Box>
                        </Typography>
                      )}
                    </Box>
                    
                    {renderExternalLinks(airport)}
                  </CardContent>
                </Card>
              </Grid>)
            ))}
            {results.length > 20 && (
              <Grid size={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    <strong>Showing first 20 of {results.length} results.</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Use more specific search terms to narrow down your search results.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* No Results State */}
        {!loading && results.length === 0 && !error && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <FlightIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Ready to search for airports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the search bar above or try the advanced features like distance calculation and nearby airport search.
            </Typography>
          </Paper>
        )}

        {/* Loading State */}
        {loading && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <FlightIcon sx={{ fontSize: 60, color: 'primary.main', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <Typography variant="h6" color="primary.main">
                Searching airports...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we find the best results for you.
              </Typography>
            </Box>
          </Paper>
        )}
      </Container>
    </>
  );
}