'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Paper, Typography, Box, TextField, Button, Grid, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PublicIcon from '@mui/icons-material/Public';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import { calculateDistance, getAirportByIata, getAirportByIcao } from 'airport-data-js';
import { Airport } from '../types';
import dynamic from 'next/dynamic';

// Map must be dynamically imported with ssr:false because leaflet references
// `window` at module evaluation time, which crashes in Cloudflare Workers.
const MapComponent = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <Box sx={{ height: 400, bgcolor: 'background.paper', borderRadius: 4 }} />
});

// Lazy-load Globe3D — user may never toggle to 2D view
const Globe3D = dynamic(() => import('./Globe3D'), {
    ssr: false,
    loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, height: '70vh', alignItems: 'center' }}>Loading Globe...</Box>
});

export default function DistanceView() {
    const [code1, setCode1] = useState('');
    const [code2, setCode2] = useState('');
    const [result, setResult] = useState<number | null>(null);
    const [airport1, setAirport1] = useState<Airport | null>(null);
    const [airport2, setAirport2] = useState<Airport | null>(null);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

    const handleViewModeChange = useCallback((_: React.MouseEvent<HTMLElement>, newMode: '2d' | '3d' | null) => {
        if (newMode) setViewMode(newMode);
    }, []);

    const handleCalculate = async () => {
        setError('');
        setResult(null);
        setAirport1(null);
        setAirport2(null);

        if (!code1 || !code2) return;

        try {
            const dist = await calculateDistance(code1.toUpperCase(), code2.toUpperCase());
            setResult(dist);

            // Fetch details for map
            const fetchAirport = async (code: string) => {
                const fn = code.length === 3 ? getAirportByIata : getAirportByIcao;
                const res = await fn(code);
                return Array.isArray(res) ? res[0] : res;
            };

            const [a1, a2] = await Promise.all([fetchAirport(code1), fetchAirport(code2)]);

            if (a1 && a2) {
                setAirport1(a1);
                setAirport2(a2);
            }
        } catch (err) {
            setError('Failed to calculate distance or find airports.');
            if (process.env.NODE_ENV === 'development') console.error(err);
        }
    };

    // Memoize map props to avoid creating new arrays on every render
    const mapCenter = useMemo<[number, number]>(() =>
        airport1 && airport2
            ? [(Number(airport1.latitude) + Number(airport2.latitude)) / 2, (Number(airport1.longitude) + Number(airport2.longitude)) / 2]
            : [20, 0],
        [airport1, airport2]
    );

    const mapMarkers = useMemo(() =>
        airport1 && airport2 ? [airport1, airport2] : [],
        [airport1, airport2]
    );

    const mapRoute = useMemo<[number, number][] | undefined>(() =>
        airport1 && airport2
            ? [[Number(airport1.latitude), Number(airport1.longitude)], [Number(airport2.latitude), Number(airport2.longitude)]]
            : undefined,
        [airport1, airport2]
    );

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ConnectingAirportsIcon color="primary" /> Distance Calculator
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="From (IATA/ICAO)"
                            value={code1}
                            onChange={(e) => setCode1(e.target.value.toUpperCase())}
                            inputProps={{ maxLength: 4 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="To (IATA/ICAO)"
                            value={code2}
                            onChange={(e) => setCode2(e.target.value.toUpperCase())}
                            inputProps={{ maxLength: 4 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Button variant="contained" fullWidth size="large" onClick={handleCalculate} disabled={!code1 || !code2}>
                            Calculate
                        </Button>
                    </Grid>
                </Grid>

                {result !== null && (
                    <Alert severity="success" icon={<MapIcon />} sx={{ mt: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle1" component="div">
                            Direct Distance: <strong>{Math.round(result)} km</strong> / <strong>{Math.round(result * 0.621371)} miles</strong>
                        </Typography>
                    </Alert>
                )}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                {airport1 && airport2 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            aria-label="view mode"
                        >
                            <ToggleButton value="3d" aria-label="3d globe">
                                <PublicIcon sx={{ mr: 1 }} /> 3D Globe
                            </ToggleButton>
                            <ToggleButton value="2d" aria-label="2d map">
                                <MapIcon sx={{ mr: 1 }} /> 2D Map
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}
            </Paper>

            {airport1 && airport2 && (
                viewMode === '3d' ? (
                    <Globe3D
                        airports={mapMarkers}
                        route={mapRoute ?? []}
                    />
                ) : (
                    <MapComponent
                        center={mapCenter}
                        zoom={2}
                        markers={mapMarkers}
                        route={mapRoute}
                    />
                )
            )}
        </Box>
    );
}
