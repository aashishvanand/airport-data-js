'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Link
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {
  getAirportByIata,
  getAirportByIcao,
  getAirportByCityCode,
  getAirportByCountryCode,
  getAirportByContinent
} from 'airport-data-js';
import { useColorMode } from './providers';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression, LatLngTuple } from 'leaflet';

// Function to create a custom flight icon for map markers
const createFlightIcon = (isDarkMode) => {
  if (typeof window === 'undefined') return null; // Return null if window is not defined (server-side)
  const L = require('leaflet');
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isDarkMode ? '#ffffff' : '#000000'}" width="24px" height="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function AirportSearch() {
  // State variables
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20, 0]);
  const [searchType, setSearchType] = useState('iata')
  const [mapZoom, setMapZoom] = useState(2)
  const theme = useTheme()
  const colorMode = useColorMode()
  const [mounted, setMounted] = useState(false)

  // Effect to load Leaflet CSS and set mounted state
  useEffect(() => {
    setMounted(true)
    const link = document.createElement('link')
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Function to handle airport search
  const handleSearch = async () => {
    try {
      // Map of search types to their corresponding functions
      const searchFunctions = {
        iata: getAirportByIata,
        icao: getAirportByIcao,
        city: getAirportByCityCode,
        country: getAirportByCountryCode,
        continent: getAirportByContinent
      }

      // Perform the search using the selected function
      const airportsResponse = await searchFunctions[searchType](query)
      const airports = Array.isArray(airportsResponse[0]) ? airportsResponse[0] : airportsResponse

      if (airports && airports.length > 0) {
        // Filter and process valid airports
        const validAirports = airports
          .map(airport => ({
            ...airport,
            latitude: parseFloat(airport.latitude),
            longitude: parseFloat(airport.longitude)
          }))
          .filter(airport => !isNaN(airport.latitude) && !isNaN(airport.longitude))

        if (validAirports.length > 0) {
          setResults(validAirports);
          setMapCenter([
            Number(validAirports[0].latitude),
            Number(validAirports[0].longitude)
          ]);
          setMapZoom(10);
          setError('');
        } else {
          setResults([]);
          setError('No valid coordinates found for the airport(s).');
        }
      } else {
        setResults([]);
        setError(`No airport found with the provided ${searchType.toUpperCase()} code.`);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the data.');
    }
  }

  // Function to render deep links for certain fields
  const renderDeepLink = (field, value) => {
    const linkMap = {
      iata: `https://www.iata.org/en/publications/directories/code-search/?airport.search=${value}`,
      wikipedia_link: value,
      home: value,
      flightradar24_url: value,
      radarbox_url: value,
      flightaware_url: value
    }

    return linkMap[field]
      ? <Link href={linkMap[field]} target="_blank" rel="noopener noreferrer">{value}</Link>
      : value
  }

  // Function to validate input based on search type
  const isValidInput = () => {
    const patterns = {
      iata: /^[A-Z]{3}$/,
      city: /^[A-Z]{3}$/,
      icao: /^[A-Z]{4}$/,
      country: /^[A-Z]{2}$/,
      continent: /^[A-Z]{2}$/
    }
    return patterns[searchType]?.test(query) || false
  }

  // Function to handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase()
    const maxLengths = { iata: 3, city: 3, icao: 4, country: 2, continent: 2 }
    setQuery(value.slice(0, maxLengths[searchType] || value.length))
  }

  if (!mounted) return null

  return (
    <>
      {/* App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Airport Search
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Search input section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Tabs value={searchType} onChange={(_, newValue) => setSearchType(newValue)} aria-label="search type tabs">
            {['iata', 'icao', 'city', 'country', 'continent'].map(type => (
              <Tab key={type} label={type.toUpperCase()} value={type} />
            ))}
          </Tabs>
          <Box sx={{ display: 'flex', mt: 2 }}>
            <TextField
              fullWidth
              label={`Enter ${searchType.toUpperCase()} code`}
              variant="outlined"
              value={query}
              onChange={handleInputChange}
              error={query.length > 0 && !isValidInput()}
              helperText={query.length > 0 && !isValidInput() ? `Invalid ${searchType.toUpperCase()} code` : ''}
            />
            <Button variant="contained" onClick={handleSearch} sx={{ ml: 2 }} disabled={!isValidInput()}>
              Search
            </Button>
          </Box>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </Paper>

        {/* Map section */}
        <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Airport Map</Typography>
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
              {results.map((airport, index) => (
                airport.latitude && airport.longitude ? (
                  <Marker 
                    key={index} 
                    position={[airport.latitude, airport.longitude] as LatLngTuple}
                    icon={createFlightIcon(theme.palette.mode === 'dark')}
                  >
                    <Popup>
                      <b>{airport.airport}</b><br />
                      IATA: {airport.iata}<br />
                      ICAO: {airport.icao}<br />
                      City: {airport.city}<br />
                      Country: {airport.country_code}
                    </Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          )}
        </Box>
      </Paper>

        {/* Airport details table */}
        {results.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Airport Details</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(results[0]).map(([field, value]) => (
                    <TableRow key={field}>
                      <TableCell>{field}</TableCell>
                      <TableCell>{renderDeepLink(field, value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </>
  )
}