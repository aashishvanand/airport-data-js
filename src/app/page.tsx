'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Grid,
  Alert,
  Tabs,
  Tab,
  Paper,
  Fade,
  CircularProgress
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import NearMeIcon from '@mui/icons-material/NearMe';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import RouteIcon from '@mui/icons-material/Route';
import dynamic from 'next/dynamic';

import {
  getAirportByIata,
  getAirportByIcao,
  searchByName,
  getAirportByCountryCode,
  getAirportByContinent,
  getAirportsByType,
  getAirportsByTimezone,
  getAirportLinks
} from 'airport-data-js';

import { useColorMode } from './providers';
import { Airport, SearchType } from '../types';

// Eagerly loaded components (needed on first tab)
import SearchBar from '../components/SearchBar';
import MapComponent from '../components/Map';
import AirportCard from '../components/AirportCard';

// Lazy-loaded tab components (only loaded when the user switches to them)
const StatsView = dynamic(() => import('../components/StatsView'), {
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
});
const LargestAirportsView = dynamic(() => import('../components/LargestAirportsView'), {
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
});
const DistanceView = dynamic(() => import('../components/DistanceView'), {
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
});
const NearbyView = dynamic(() => import('../components/NearbyView'), {
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
});
const ValidationView = dynamic(() => import('../components/ValidationView'), {
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
});
const MultiCityTripView = dynamic(() => import('../components/MultiCityTripView'), {
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
});

// Module-level constant — stable references, never recreated
const searchFunctions: Record<string, (query: string) => Promise<Airport[]>> = {
  iata: getAirportByIata,
  icao: getAirportByIcao,
  name: searchByName,
  country: getAirportByCountryCode,
  continent: getAirportByContinent,
  type: getAirportsByType,
  timezone: getAirportsByTimezone
};

const validationPatterns: Record<string, RegExp> = {
  iata: /^[A-Z]{3}$/,
  icao: /^[A-Z]{4}$/,
  name: /^.{2,}$/,
  country: /^[A-Z]{2}$/,
  continent: /^[A-Z]{2}$/,
  type: /^.+$/,
  timezone: /^.+$/
};

export default function UpdatedAirportSearch() {
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState<Airport[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});

  const theme = useTheme();
  const colorMode = useColorMode();

  // Caches to avoid redundant network requests
  const searchCache = useRef(new Map<string, Airport[]>());
  const linksCache = useRef(new Map<string, Record<string, string>>());

  const handleSearch = useCallback(async (type: SearchType, query: string) => {
    setLoading(true);
    setError('');

    try {
      // Check search cache first
      const cacheKey = `${type}:${query}`;
      let validAirports: Airport[];

      if (searchCache.current.has(cacheKey)) {
        validAirports = searchCache.current.get(cacheKey)!;
      } else {
        const airportsResponse = await searchFunctions[type](query);
        const airports = Array.isArray(airportsResponse) ? airportsResponse : [airportsResponse].filter(Boolean);

        if (airports && airports.length > 0) {
          validAirports = airports.filter(a => a.airport);
          if (validAirports.length > 0) {
            searchCache.current.set(cacheKey, validAirports);
          }
        } else {
          validAirports = [];
        }
      }

      if (validAirports.length > 0) {
        setResults(validAirports);

        // Get external links for the first airport if single result
        if (validAirports.length === 1 && (validAirports[0].iata || validAirports[0].icao)) {
          const linkKey = validAirports[0].iata || validAirports[0].icao;
          if (linksCache.current.has(linkKey)) {
            setLinks(linksCache.current.get(linkKey)!);
          } else {
            try {
              const airportLinks = await getAirportLinks(linkKey);
              const resolved = airportLinks || {};
              linksCache.current.set(linkKey, resolved);
              setLinks(resolved);
            } catch (err) {
              if (process.env.NODE_ENV === 'development') console.error('Failed to fetch links:', err);
            }
          }
        } else {
          setLinks({});
        }
        setError('');
      } else {
        setResults([]);
        setError(`No airports found for ${type}: ${query}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while fetching data.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const isValidInput = useCallback((type: SearchType, query: string): boolean => {
    if (!query) return false;
    return validationPatterns[type]?.test(query) || false;
  }, []);

  const handleTabChange = useCallback((_: React.SyntheticEvent, v: number) => {
    setActiveTab(v);
  }, []);

  // Memoized derived values to avoid recomputation on every render
  const hasCoordinates = useMemo(() => results.some(a => a.latitude && a.longitude), [results]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (results.length > 0 && results[0].latitude && results[0].longitude) {
      return [Number(results[0].latitude), Number(results[0].longitude)];
    }
    return [20, 0];
  }, [results]);

  const mapZoom = useMemo(() => results.length === 1 ? 12 : 3, [results.length]);

  const displayedResults = useMemo(() => results.slice(0, 20), [results]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Search
        return (
          <Fade in={activeTab === 0}>
            <Box>
              <SearchBar onSearch={handleSearch} loading={loading} isValid={isValidInput} />

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              {results.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  {/* Show map for first few results to avoid clutter */}
                  {hasCoordinates && (
                    <Box sx={{ mb: 4 }}>
                      <MapComponent
                        center={mapCenter}
                        zoom={mapZoom}
                        markers={results}
                      />
                    </Box>
                  )}

                  <Typography variant="h6" gutterBottom color="text.secondary">
                    Found {results.length} results
                  </Typography>

                  <Grid container spacing={3}>
                    {displayedResults.map((airport, index) => (
                      <Grid size={{ xs: 12, md: 6, lg: 4 }} key={`${airport.iata}-${airport.icao}-${index}`}>
                        <AirportCard
                          airport={airport}
                          extraLinks={results.length === 1 ? links : undefined}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  {results.length > 20 && (
                    <Alert severity="info" sx={{ mt: 2 }}>Only showing first 20 results.</Alert>
                  )}
                </Box>
              )}
            </Box>
          </Fade>
        );
      case 1: return <StatsView />;
      case 2: return <LargestAirportsView />;
      case 3: return <DistanceView />;
      case 4: return <NearbyView />;
      case 5: return <ValidationView />;
      case 6: return <MultiCityTripView />;
      default: return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="default" sx={{
        backdropFilter: 'blur(20px)',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <FlightIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 800, background: `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Airport Data
            </Typography>
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ bgcolor: 'background.default', flexGrow: 1, pb: 8 }}>
        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Container maxWidth="xl">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Search" icon={<SearchIcon />} iconPosition="start" />
              <Tab label="Statistics" icon={<BarChartIcon />} iconPosition="start" />
              <Tab label="Top Airports" icon={<EmojiEventsIcon />} iconPosition="start" />
              <Tab label="Distance" icon={<ConnectingAirportsIcon />} iconPosition="start" />
              <Tab label="Nearby" icon={<NearMeIcon />} iconPosition="start" />
              <Tab label="Validation" icon={<VerifiedUserIcon />} iconPosition="start" />
              <Tab label="Multi-City" icon={<RouteIcon />} iconPosition="start" />
            </Tabs>
          </Container>
        </Box>

        {/* Main Content Area */}
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {renderTabContent()}
        </Container>
      </Box>
    </Box>
  );
}
