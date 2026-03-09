'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, Alert } from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import FlightIcon from '@mui/icons-material/Flight';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { getAirportByIata, getAirportByIcao } from 'airport-data-js';
import { Airport } from '../types';
import dynamic from 'next/dynamic';

// Map must be dynamically imported with ssr:false because leaflet references
// `window` at module evaluation time, which crashes in Cloudflare Workers.
const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <Box sx={{ height: 400, bgcolor: 'background.paper', borderRadius: 4 }} />
});

// Lazy-load Globe3D — user may never toggle to 3D view
const Globe3D = dynamic(() => import('./Globe3D'), {
    ssr: false,
    loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, height: '70vh', alignItems: 'center' }}>Loading Globe...</Box>
});

export default function MultiCityTripView() {
    const [routeString, setRouteString] = useState('');
    const [airports, setAirports] = useState<Airport[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    const handleVisualize = async () => {
        setError('');
        setAirports([]);
        setLoading(true);

        if (!routeString) {
            setLoading(false);
            return;
        }

        // Parse route string: split by '-', ',', ' ', or '>'
        const codes = routeString.split(/[-,\s>]+/).map(s => s.trim().toUpperCase()).filter(Boolean);

        if (codes.length < 2) {
            setError('Please enter at least two airport codes (e.g., SIN-LHR).');
            setLoading(false);
            return;
        }

        try {
            const missingCodes: string[] = [];

            // Fetch all airports in parallel instead of sequentially
            const fetchPromises = codes.map(async (code) => {
                try {
                    let airport: Airport | null = null;
                    if (code.length === 3) {
                        const res = await getAirportByIata(code);
                        airport = Array.isArray(res) ? res[0] : res;
                    } else if (code.length === 4) {
                        const res = await getAirportByIcao(code);
                        airport = Array.isArray(res) ? res[0] : res;
                    }
                    return { code, airport };
                } catch (e) {
                    if (process.env.NODE_ENV === 'development') console.error(`Error fetching ${code}`, e);
                    return { code, airport: null };
                }
            });

            const results = await Promise.allSettled(fetchPromises);
            const fetchedAirports: Airport[] = [];

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    const { code, airport } = result.value;
                    if (airport && airport.latitude && airport.longitude) {
                        fetchedAirports.push(airport);
                    } else {
                        missingCodes.push(code);
                    }
                }
            }

            if (fetchedAirports.length > 0) {
                setAirports(fetchedAirports);
                if (missingCodes.length > 0) {
                    setError(`Could not find airports for: ${missingCodes.join(', ')}. Showing path for found airports.`);
                }
            } else {
                setError('No valid airports found for the given route.');
            }

        } catch (err) {
            setError('An error occurred while processing the route.');
            if (process.env.NODE_ENV === 'development') console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Memoize expensive computations to avoid recalculation on every render
    const routeCoordinates = useMemo<[number, number][]>(
        () => airports.map(a => [Number(a.latitude), Number(a.longitude)]),
        [airports]
    );

    const center = useMemo<[number, number]>(() => {
        if (routeCoordinates.length === 0) return [20, 0];
        const lats = routeCoordinates.map(c => c[0]);
        const lngs = routeCoordinates.map(c => c[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    }, [routeCoordinates]);

    const handleViewModeChange = useCallback((_: React.MouseEvent<HTMLElement>, newMode: '2d' | '3d' | null) => {
        if (newMode) setViewMode(newMode);
    }, []);

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RouteIcon color="primary" /> Multi-City Trip Visualizer
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="top">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                            fullWidth
                            label="Route (e.g., SIN-MAA-DEL-LHR)"
                            placeholder="Enter airport codes separated by hyphens (e.g. SIN-MAA-DEL-LHR)"
                            value={routeString}
                            onChange={(e) => setRouteString(e.target.value)}
                            helperText="You can use IATA (3 letter) or ICAO (4 letter) codes mixed together."
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ height: 56 }}
                            onClick={handleVisualize}
                            disabled={loading || !routeString}
                            startIcon={<FlightIcon />}
                        >
                            {loading ? 'Loading...' : 'Visualize Route'}
                        </Button>
                    </Grid>
                </Grid>

                {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}

                {airports.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            aria-label="view mode"
                        >
                            <ToggleButton value="2d" aria-label="2d map">
                                <MapIcon sx={{ mr: 1 }} /> 2D Map
                            </ToggleButton>
                            <ToggleButton value="3d" aria-label="3d globe">
                                <PublicIcon sx={{ mr: 1 }} /> 3D Globe
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}
            </Paper>

            {airports.length > 0 && (
                viewMode === '2d' ? (
                    <MapComponent
                        center={center}
                        zoom={2}
                        markers={airports}
                        route={routeCoordinates}
                    />
                ) : (
                    <Globe3D
                        airports={airports}
                        route={routeCoordinates}
                    />
                )
            )}
        </Box>
    );
}
