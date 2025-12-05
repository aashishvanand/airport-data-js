'use client';

import React, { useState } from 'react';
import {
    Paper, Typography, Box, TextField, Button, Grid,
    Card, CardContent, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PublicIcon from '@mui/icons-material/Public';
import { getAirportStatsByCountry, getAirportStatsByContinent } from 'airport-data-js';

export default function StatsView() {
    const [mode, setMode] = useState<'country' | 'continent'>('country');
    const [input, setInput] = useState('');
    // Generic stats state since I don't know the exact shape yet, assuming generic object
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState('');

    const handleFetchStats = async () => {
        setError('');
        setStats(null);
        try {
            let result;
            if (mode === 'country') {
                if (input.length !== 2) throw new Error('Country code must be 2 letters');
                result = await getAirportStatsByCountry(input.toUpperCase());
            } else {
                if (input.length !== 2) throw new Error('Continent code must be 2 letters');
                result = await getAirportStatsByContinent(input.toUpperCase());
            }
            setStats(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch statistics');
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon color="primary" /> Airport Statistics
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Mode</InputLabel>
                            <Select
                                value={mode}
                                label="Mode"
                                onChange={(e) => setMode(e.target.value as 'country' | 'continent')}
                            >
                                <MenuItem value="country">By Country</MenuItem>
                                <MenuItem value="continent">By Continent</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label={mode === 'country' ? "Country Code (e.g. US)" : "Continent Code (e.g. NA)"}
                            value={input}
                            onChange={(e) => setInput(e.target.value.toUpperCase())}
                            inputProps={{ maxLength: 2 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                        <Button variant="contained" onClick={handleFetchStats} disabled={!input}>
                            Analyze
                        </Button>
                    </Grid>
                </Grid>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
                )}
            </Paper>

            {stats && (
                <Grid container spacing={3}>
                    {/* Displaying raw stats for now, formatted nicely */}
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                            <CardContent>
                                <Typography variant="h4" fontWeight={800}>{stats.totalCount || stats.count || 0}</Typography>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Airports</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Dynamic rendering of other properties if available */}
                    {Object.entries(stats).map(([key, value]) => {
                        if (key === 'totalCount' || key === 'count' || typeof value === 'object') return null;
                        return (
                            <Grid size={{ xs: 6, md: 3 }} key={key}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" color="primary">{value as React.ReactNode}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )
                    })}
                </Grid>
            )}
        </Box>
    );
}
