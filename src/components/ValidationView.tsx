'use client';

import React, { useState } from 'react';
import { Paper, Typography, Box, TextField, Grid, Chip } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { validateIataCode, validateIcaoCode } from 'airport-data-js';

export default function ValidationView() {
    const [iataInput, setIataInput] = useState('');
    const [icaoInput, setIcaoInput] = useState('');
    const [iataStatus, setIataStatus] = useState<boolean | null>(null);
    const [icaoStatus, setIcaoStatus] = useState<boolean | null>(null);

    // Debounced IATA validation with stale-request guard
    React.useEffect(() => {
        if (iataInput.length !== 3) {
            setIataStatus(null);
            return;
        }

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                // @ts-ignore
                const result = await validateIataCode(iataInput.toUpperCase());
                if (!cancelled) setIataStatus(result);
            } catch (e) {
                if (!cancelled) setIataStatus(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [iataInput]);

    // Debounced ICAO validation with stale-request guard
    React.useEffect(() => {
        if (icaoInput.length !== 4) {
            setIcaoStatus(null);
            return;
        }

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                // @ts-ignore
                const result = await validateIcaoCode(icaoInput.toUpperCase());
                if (!cancelled) setIcaoStatus(result);
            } catch (e) {
                if (!cancelled) setIcaoStatus(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [icaoInput]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUserIcon color="primary" /> Validation Utilities
            </Typography>

            <Typography paragraph color="text.secondary">
                Use these tools to verify if an airport code is valid according to the dataset.
            </Typography>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>IATA Validator</Typography>
                        <TextField
                            fullWidth
                            label="Enter 3-Letter Code"
                            value={iataInput}
                            onChange={(e) => setIataInput(e.target.value.toUpperCase())}
                            inputProps={{ maxLength: 3 }}
                            sx={{ mb: 2 }}
                        />

                        {iataInput.length === 3 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                {iataStatus ? (
                                    <Chip icon={<CheckCircleIcon />} label="Valid IATA Code" color="success" />
                                ) : (
                                    <Chip icon={<ErrorIcon />} label="Invalid IATA Code" color="error" />
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>ICAO Validator</Typography>
                        <TextField
                            fullWidth
                            label="Enter 4-Letter Code"
                            value={icaoInput}
                            onChange={(e) => setIcaoInput(e.target.value.toUpperCase())}
                            inputProps={{ maxLength: 4 }}
                            sx={{ mb: 2 }}
                        />

                        {icaoInput.length === 4 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                {icaoStatus ? (
                                    <Chip icon={<CheckCircleIcon />} label="Valid ICAO Code" color="success" />
                                ) : (
                                    <Chip icon={<ErrorIcon />} label="Invalid ICAO Code" color="error" />
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
