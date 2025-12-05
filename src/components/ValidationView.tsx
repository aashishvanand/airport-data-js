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

    // Wrapper for validation to handle async/sync nature if unknown
    const isValidIata = (code: string) => {
        if (!code) return null;
        try {
            // @ts-ignore
            return validateIataCode(code);
        } catch { return false; }
    }

    const isValidIcao = (code: string) => {
        if (!code) return null;
        try {
            // @ts-ignore
            return validateIcaoCode(code);
        } catch { return false; }
    }

    const iataStatus = isValidIata(iataInput.toUpperCase());
    const icaoStatus = isValidIcao(icaoInput.toUpperCase());

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
