import React, { useState } from 'react';
import {
  getAirportByIata,
  getAirportByIcao,
  getAirportByCityCode,
  getAirportByCountryCode,
  getAirportByContinent
} from 'airport-data-js';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import { clarity } from 'react-microsoft-clarity';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import IconButton from '@mui/material/IconButton';

function App() {
  clarity.init("jbrv3kn1w7");
  clarity.consent();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setResults({});
    setError('');
    setQuery(''); // Clear query when changing tabs
  };

  const handleSearch = async () => {
    try {
      let airports;
      switch (currentTab) {
        case 0:
          airports = await getAirportByIata(query);
          break;
        case 1:
          airports = await getAirportByIcao(query);
          break;
        case 2:
          airports = await getAirportByCityCode(query);
          break;
        case 3:
          airports = await getAirportByCountryCode(query);
          break;
        case 4:
          airports = await getAirportByContinent(query);
          break;
        default:
          setError('Invalid search type');
          return;
      }

      if (airports && airports.length > 0) {
        setResults(airports);
        setCurrentIndex(0); // Start at the first record
        setError('');
      } else {
        setResults([]);
        setError(`No airport found with the provided ${getLabel(currentTab)} code.`);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the data.');
    }
  };

  const showNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, results.length - 1));
  };

  const showPrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const getLabel = (tabIndex) => {
    switch (tabIndex) {
      case 0: return 'IATA';
      case 1: return 'ICAO';
      case 2: return 'City';
      case 3: return 'Country';
      case 4: return 'Continent';
      default: return '';
    }
  };

  const validateCode = (code) => {
    switch (currentTab) {
      case 0: // IATA
        return /^[A-Z]{3}$/i.test(code);
      case 1: // ICAO
        return /^[A-Z]{4}$/i.test(code);
      case 2: // City
        return /^.{3}$/i.test(code);
      case 3: // Country
        return /^[A-Z]{2}$/i.test(code);
      case 4: // Continent
        return /^[A-Z]{2}$/i.test(code);
      default:
        return false;
    }
  };

  const formatValue = (value, field = '') => {
    field = field || '';
    
    if (value === null || value === undefined) {
      return 'NA';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else if (typeof value === 'string') {
      if (value.startsWith('http')) {
        return <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>;
      } else if (field.toLowerCase() === 'phone' && value) {
        return <a href={`tel:${value}`}>{value}</a>;
      } else if (field.toLowerCase() === 'email' && value) {
        return <a href={`mailto:${value}`}>{value}</a>;
      } else {
        return String(value);
      }
    } else {
      return String(value);
    }
  };

  return (
    <Container>
      <Box my={4}>
        <Card>
          <CardContent>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="Search Tabs">
              <Tab label="Search by IATA" />
              <Tab label="Search by ICAO" />
              <Tab label="Search by City Code" />
              <Tab label="Search by Country Code" />
              <Tab label="Search by Continent" />
            </Tabs>
            <Box marginTop={2} display="flex" alignItems="center" marginBottom={2}>
              <TextField
                label={`${getLabel(currentTab)} Code`}
                variant="outlined"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onInput={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  if (!validateCode(e.target.value)) {
                    setError(`Please enter a valid ${getLabel(currentTab)} code.`);
                  } else {
                    setError('');
                  }
                }}
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={!!error || !validateCode(query)}
                style={{ marginLeft: '10px' }}
              >
                Search
              </Button>
            </Box>
            {error && <Typography color="error">{error}</Typography>}
          </CardContent>
        </Card>
        {results.length > 0 && (
          <Paper elevation={3} style={{ marginTop: '20px', position: 'relative' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow style={{ backgroundColor: '#3f51b5' }}>
                    <TableCell style={{ color: 'white' }}>Field</TableCell>
                    <TableCell style={{ color: 'white' }}>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(results[currentIndex]).map(([field, value]) => (
                    <TableRow key={field}>
                      <TableCell>{field}</TableCell>
                      <TableCell>{formatValue(value, field)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {results.length > 1 && (
              <>
                <Box
                  position="absolute"
                  top="50%"
                  left={0}
                  style={{ transform: 'translateY(-50%)' }}
                >
                  <IconButton
                    onClick={showPrevious}
                    disabled={currentIndex === 0}
                  >
                    <ArrowBackIosIcon />
                  </IconButton>
                </Box>
                <Box
                  position="absolute"
                  top="50%"
                  right={0}
                  style={{ transform: 'translateY(-50%)' }}
                >
                  <IconButton
                    onClick={showNext}
                    disabled={currentIndex === results.length - 1}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default App;
