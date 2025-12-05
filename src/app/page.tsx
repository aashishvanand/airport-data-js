'use client'

import React, { useState } from 'react';
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
  Fade
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

// Component Imports
import SearchBar from '../components/SearchBar';
import MapComponent from '../components/Map';
import AirportCard from '../components/AirportCard';
import StatsView from '../components/StatsView';
import LargestAirportsView from '../components/LargestAirportsView';
import DistanceView from '../components/DistanceView';
import NearbyView from '../components/NearbyView';
import ValidationView from '../components/ValidationView';

export default function UpdatedAirportSearch() {
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState<Airport[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});

  const theme = useTheme();
  const colorMode = useColorMode();

  const handleSearch = async (type: SearchType, query: string) => {
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

      const airportsResponse = await searchFunctions[type](query);
      const airports = Array.isArray(airportsResponse) ? airportsResponse : [airportsResponse].filter(Boolean);

      if (airports && airports.length > 0) {
        // Filter out bad data
        const validAirports = airports.filter(a => a.airport);

        if (validAirports.length > 0) {
          setResults(validAirports);

          // Get external links for the first airport if single result
          if (validAirports.length === 1 && (validAirports[0].iata || validAirports[0].icao)) {
            try {
              const airportLinks = await getAirportLinks(validAirports[0].iata || validAirports[0].icao);
              setLinks(airportLinks || {});
            } catch (err) {
              console.error('Failed to fetch links:', err);
            }
          }
          else {
            setLinks({});
          }
          setError('');
        } else {
          setResults([]);
          setError('No valid airport data found.');
        }
      } else {
        setResults([]);
        setError(`No airports found for ${type}: ${query}`);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while fetching data.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const isValidInput = (type: SearchType, query: string): boolean => {
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
    return patterns[type]?.test(query) || false;
  };

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
                  {results.some(a => a.latitude && a.longitude) && (
                    <Box sx={{ mb: 4 }}>
                      <MapComponent
                        center={[Number(results[0].latitude), Number(results[0].longitude)]}
                        zoom={results.length === 1 ? 12 : 3}
                        markers={results}
                      />
                    </Box>
                  )}

                  <Typography variant="h6" gutterBottom color="text.secondary">
                    Found {results.length} results
                  </Typography>

                  <Grid container spacing={3}>
                    {results.slice(0, 20).map((airport, index) => (
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
              onChange={(_, v) => setActiveTab(v)}
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