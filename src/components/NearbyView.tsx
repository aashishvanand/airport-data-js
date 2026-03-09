'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, Slider, Alert } from '@mui/material';
import NearMeIcon from '@mui/icons-material/NearMe';
import { findNearbyAirports } from 'airport-data-js';
import { Airport } from '../types';
import dynamic from 'next/dynamic';
import AirportCard from './AirportCard';

// Map must be dynamically imported with ssr:false because leaflet references
// `window` at module evaluation time, which crashes in Cloudflare Workers.
const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <Box sx={{ height: 400, bgcolor: 'background.paper', borderRadius: 4 }} />
});

export default function NearbyView() {
    const [lat, setLat] = useState<number>(1.3521); // Singapore
    const [lon, setLon] = useState<number>(103.8198);
    const [radius, setRadius] = useState<number>(50);
    const [airports, setAirports] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Track mounted state to prevent state updates after unmount
    const mountedRef = useRef(true);
    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        setSearched(true);
        try {
            // @ts-ignore - Assuming signature matches
            const results = await findNearbyAirports(lat, lon, radius);
            if (mountedRef.current) setAirports(results || []);
        } catch (err) {
            if (process.env.NODE_ENV === 'development') console.error(err);
            if (mountedRef.current) setAirports([]);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    };

    const getUserLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (mountedRef.current) {
                        setLat(position.coords.latitude);
                        setLon(position.coords.longitude);
                    }
                },
                (error) => {
                    if (process.env.NODE_ENV === 'development') console.error("Error getting location", error);
                }
            );
        }
    }, []);

    // Memoize map center to avoid creating a new array on every render
    const center = useMemo<[number, number]>(() => [lat, lon], [lat, lon]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NearMeIcon color="secondary" /> Nearby Airports
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Button variant="outlined" startIcon={<NearMeIcon />} onClick={getUserLocation} sx={{ mb: 2 }}>
                        Use My Location
                    </Button>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                type="number"
                                value={lat}
                                onChange={(e) => setLat(parseFloat(e.target.value))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Longitude"
                                type="number"
                                value={lon}
                                onChange={(e) => setLon(parseFloat(e.target.value))}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Typography gutterBottom>Search Radius: {radius} km</Typography>
                <Slider
                    value={radius}
                    onChange={(_, val) => setRadius(val as number)}
                    min={10}
                    max={500}
                    valueLabelDisplay="auto"
                    sx={{ mb: 3 }}
                />

                <Button variant="contained" fullWidth size="large" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Searching...' : 'Find Airports'}
                </Button>
            </Paper>

            {searched && airports.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <MapComponent
                        center={center}
                        zoom={9}
                        markers={airports}
                    />
                </Box>
            )}

            {searched && airports.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>No airports found within {radius}km.</Alert>
            )}

            <Grid container spacing={3}>
                {airports.map((airport) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={airport.iata || airport.icao}>
                        <AirportCard airport={airport} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
