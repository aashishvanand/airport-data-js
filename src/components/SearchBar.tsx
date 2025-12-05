'use client';

import React, { useState, useEffect } from 'react';
import {
    Paper,
    Tabs,
    Tab,
    Box,
    TextField,
    Autocomplete,
    Typography,
    Button,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { SearchType, Airport } from '../types';
import { getAutocompleteSuggestions } from 'airport-data-js';

interface SearchBarProps {
    onSearch: (type: SearchType, query: string) => void;
    loading: boolean;
    isValid: (type: SearchType, query: string) => boolean;
}

export default function SearchBar({ onSearch, loading, isValid }: SearchBarProps) {
    const [searchType, setSearchType] = useState<SearchType>('iata');
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Airport[]>([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length >= 2 && searchType === 'name') {
                try {
                    const autocompleteSuggestions = await getAutocompleteSuggestions(query);
                    setSuggestions(autocompleteSuggestions || []);
                } catch (err) {
                    console.error('Failed to fetch suggestions:', err);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query, searchType]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        const maxLengths: Record<string, number> = { iata: 3, icao: 4, country: 2, continent: 2 };
        if (maxLengths[searchType]) {
            setQuery(value.slice(0, maxLengths[searchType]));
        } else {
            setQuery(e.target.value);
        }
    };

    const getHelperText = (type: SearchType) => {
        switch (type) {
            case 'country': return "ISO 2-letter code (e.g. US, SG)";
            case 'continent': return "ISO 2-letter code (e.g. AS, EU)";
            case 'timezone': return "Format: Area/Location (e.g. Asia/Singapore)";
            case 'type': return "e.g. large_airport, medium_airport";
            default: return "";
        }
    };

    const handleSearchSubmit = () => {
        if (isValid(searchType, query)) {
            onSearch(searchType, query);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid(searchType, query)) {
            onSearch(searchType, query);
        }
    }

    return (
        <Paper sx={{
            p: 4,
            mb: 3,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
        }}>
            <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                opacity: 0.05,
                transform: 'rotate(-15deg)',
                pointerEvents: 'none'
            }}>
                <FlightTakeoffIcon sx={{ fontSize: 200 }} />
            </Box>

            <Typography variant="h5" gutterBottom fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon color="primary" />
                Find Your Airport
            </Typography>

            <Tabs
                value={searchType}
                onChange={(_, newValue) => setSearchType(newValue)}
                sx={{ mb: 3 }}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
            >
                {['iata', 'icao', 'name', 'country', 'continent', 'type', 'timezone'].map(type => (
                    <Tab key={type} label={type.toUpperCase()} value={type} sx={{ fontWeight: 600 }} />
                ))}
            </Tabs>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                {searchType === 'name' ? (
                    <Autocomplete
                        freeSolo
                        options={suggestions}
                        onChange={(event, newValue) => {
                            if (newValue && typeof newValue !== 'string') {
                                // Prefer IATA, fallback to ICAO
                                const code = newValue.iata || newValue.icao || '';
                                if (code) {
                                    setSearchType(newValue.iata ? 'iata' : 'icao');
                                    setQuery(code);
                                }
                            }
                        }}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : `${option.iata} - ${option.airport}`
                        }
                        renderOption={(props, option) => (
                            // @ts-ignore - Key is handled by Autocomplete
                            <li {...props} key={option.id || `${option.iata}-${option.icao}`}>
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                        {option.iata} - {option.airport}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {[option.city, option.country_code].filter(Boolean).join(', ')}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                        inputValue={query}
                        onInputChange={(_, newValue) => setQuery(newValue || '')}
                        sx={{ flexGrow: 1 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={`Search by ${searchType.toUpperCase()}`}
                                variant="outlined"
                                fullWidth
                                onKeyDown={handleKeyDown}
                                error={query.length > 0 && !isValid(searchType, query)}
                                helperText={query.length > 0 && !isValid(searchType, query) ? `Invalid format` : getHelperText(searchType)}
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        )}
                    />
                ) : (
                    <TextField
                        fullWidth
                        label={`Enter ${searchType.toUpperCase()}`}
                        variant="outlined"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        error={query.length > 0 && !isValid(searchType, query)}
                        helperText={query.length > 0 && !isValid(searchType, query) ? `Invalid format` : getHelperText(searchType)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            )
                        }}
                    />
                )}
                <Button
                    variant="contained"
                    onClick={handleSearchSubmit}
                    disabled={loading || !isValid(searchType, query)}
                    size="large"
                    sx={{ minWidth: 140, height: 56 }}
                >
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </Box>
        </Paper>
    );
}
