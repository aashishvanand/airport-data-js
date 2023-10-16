import React, { useState } from 'react';
import { getAirportByIata } from 'airport-data-js';
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
} from '@mui/material';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [error, setError] = useState('');

  const handleSearchByIATA = async () => {
    try {
      const airport = await getAirportByIata(query);
      if (airport && airport.length > 0) {
        setResults(airport[0]);
        setError(''); // clear previous error if search is successful
      } else {
        setResults({});
        setError('No airport found with the provided IATA code.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the data.');
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'NA';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else if (typeof value === 'string' && value.startsWith('http')) {
      return <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>;
    } else {
      return String(value);
    }
  };

  const validateIATA = (query) => {
    const regex = /^[A-Z]{3}$/;
    return regex.test(query);
  };

  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ padding: '10px', backgroundColor: '#f5f5f5' }}>
          Search Airport by IATA Code
        </Typography>
        <Box display="flex" alignItems="center">
          <TextField
            label="IATA Code"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onInput={(e) => {
              // Turn on auto caps
              e.target.value = e.target.value.toUpperCase();

              // Validate IATA code
              if (!validateIATA(e.target.value)) {
                setError('Please enter a valid IATA code.');
              } else {
                setError('');
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearchByIATA}
            sx={{
              padding: '10px',
              backgroundColor: '#007bff',
              borderRadius: '4px',
              border: '1px solid #007bff',
              marginLeft: '10px',
              width: '100px',
            }}
            disabled={!!error || !validateIATA(query)} // The button is disabled if there's an error or the IATA code is invalid
          >
            Search
          </Button>
        </Box>
        {error && <Typography color="error">{error}</Typography>}

        {Object.keys(results).length > 0 && (
          <TableContainer sx={{ paddingTop: '10px', backgroundColor: '#fff' }}>
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: '10px', backgroundColor: '#f5f5f5' }}>Field</TableCell>
                  <TableCell sx={{ padding: '10px', backgroundColor: '#f5f5f5' }}>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(results).map(([field, value]) => (
                  <TableRow key={field}>
                    <TableCell sx={{ padding: '10px', backgroundColor: '#fff' }}>{field}</TableCell>
                    <TableCell sx={{ padding: '10px', backgroundColor: '#fff' }}>{formatValue(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

export default App;
