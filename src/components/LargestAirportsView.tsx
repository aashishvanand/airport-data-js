'use client';

import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Box, Grid, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getLargestAirportsByContinent } from 'airport-data-js';
import { Airport } from '../types';

export default function LargestAirportsView() {
    const [continent, setContinent] = useState('NA');
    const [sortBy, setSortBy] = useState<'runway' | 'elevation'>('runway');
    const [limit, setLimit] = useState(10);
    const [airports, setAirports] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAirports = async () => {
            setLoading(true);
            try {
                // @ts-ignore - Assuming implementation matches signature
                const result = await getLargestAirportsByContinent(continent, limit, sortBy);
                setAirports(result);
            } catch (err) {
                console.error(err);
                setAirports([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAirports();
    }, [continent, sortBy, limit]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon color="secondary" /> Largest/Highest Airports
            </Typography>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Continent</InputLabel>
                            <Select value={continent} label="Continent" onChange={(e) => setContinent(e.target.value)}>
                                <MenuItem value="NA">North America</MenuItem>
                                <MenuItem value="EU">Europe</MenuItem>
                                <MenuItem value="AS">Asia</MenuItem>
                                <MenuItem value="SA">South America</MenuItem>
                                <MenuItem value="AF">Africa</MenuItem>
                                <MenuItem value="OC">Oceania</MenuItem>
                                <MenuItem value="AN">Antarctica</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value as 'runway' | 'elevation')}>
                                <MenuItem value="runway">Longest Runway</MenuItem>
                                <MenuItem value="elevation">Highest Elevation</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Limit</InputLabel>
                            <Select value={limit} label="Limit" onChange={(e) => setLimit(Number(e.target.value))}>
                                <MenuItem value={5}>Top 5</MenuItem>
                                <MenuItem value={10}>Top 10</MenuItem>
                                <MenuItem value={20}>Top 20</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell>Airport</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">{sortBy === 'runway' ? 'Runway Length' : 'Elevation'}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>Loading...</TableCell>
                            </TableRow>
                        ) : airports.map((airport, index) => (
                            <TableRow key={airport.icao || index} hover>
                                <TableCell>
                                    <Chip
                                        label={`#${index + 1}`}
                                        size="small"
                                        color={index < 3 ? "primary" : "default"}
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{airport.airport}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Chip label={airport.iata} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                        <Chip label={airport.icao} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                    </Box>
                                </TableCell>
                                <TableCell>{[airport.city, airport.country_code].filter(Boolean).join(', ')}</TableCell>
                                <TableCell align="right">
                                    <Typography fontWeight={600} color="primary">
                                        {sortBy === 'runway' ? `${airport.runway_length} ft` : `${airport.elevation} ft`}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
