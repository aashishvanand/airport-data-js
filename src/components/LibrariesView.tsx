'use client';

import React from 'react';
import {
    Typography, Box, Card, CardContent, Grid, Chip, Button, Paper, Stack
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CodeIcon from '@mui/icons-material/Code';
import TerminalIcon from '@mui/icons-material/Terminal';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface Library {
    name: string;
    language: string;
    description: string;
    packageName: string;
    installCommand: string;
    githubUrl: string;
    registryUrl: string;
    registryLabel: string;
    status: 'available' | 'coming_soon';
    icon: string;
    color: string;
}

const libraries: Library[] = [
    {
        name: 'airport-data-js',
        language: 'JavaScript / TypeScript',
        description: 'Comprehensive airport data library for Node.js and browser environments. Search airports by IATA, ICAO, name, country, continent, type, and timezone. Includes distance calculation, nearby airport search, and validation utilities.',
        packageName: 'airport-data-js',
        installCommand: 'npm install airport-data-js',
        githubUrl: 'https://github.com/aashishvanand/airport-data-js',
        registryUrl: 'https://www.npmjs.com/package/airport-data-js',
        registryLabel: 'npm',
        status: 'available',
        icon: 'JS',
        color: '#f7df1e',
    },
    {
        name: 'airports-py',
        language: 'Python',
        description: 'Python library for accessing airport data with an intuitive API. Look up airports by IATA, ICAO, name, country, and more. Ideal for data analysis, travel applications, and aviation projects.',
        packageName: 'airports-py',
        installCommand: 'pip install airports-py',
        githubUrl: 'https://github.com/aashishvanand/airport-data-python',
        registryUrl: 'https://pypi.org/project/airports-py/',
        registryLabel: 'PyPI',
        status: 'available',
        icon: 'PY',
        color: '#3776ab',
    },
    {
        name: 'airport_data_dart',
        language: 'Dart / Flutter',
        description: 'Airport data library for Dart and Flutter applications. Build cross-platform mobile, web, and desktop apps with comprehensive airport search and lookup capabilities.',
        packageName: 'airport_data_dart',
        installCommand: 'dart pub add airport_data_dart',
        githubUrl: '',
        registryUrl: '',
        registryLabel: 'pub.dev',
        status: 'coming_soon',
        icon: 'DT',
        color: '#0175c2',
    },
    {
        name: 'airport-data-rs',
        language: 'Rust',
        description: 'High-performance airport data library for Rust. Leverage Rust\'s speed and safety for aviation data lookups in CLI tools, web servers, and embedded systems.',
        packageName: 'airport-data-rs',
        installCommand: 'cargo add airport-data-rs',
        githubUrl: '',
        registryUrl: '',
        registryLabel: 'crates.io',
        status: 'coming_soon',
        icon: 'RS',
        color: '#dea584',
    },
];

function LibraryCard({ lib }: { lib: Library }) {
    const isAvailable = lib.status === 'available';

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
                opacity: isAvailable ? 1 : 0.75,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': isAvailable
                    ? { transform: 'translateY(-4px)', boxShadow: 6 }
                    : {},
            }}
        >
            {!isAvailable && (
                <Chip
                    icon={<HourglassEmptyIcon />}
                    label="Coming Soon"
                    color="warning"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: -12,
                        right: 16,
                        fontWeight: 600,
                        zIndex: 1,
                    }}
                />
            )}

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: lib.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: lib.color === '#f7df1e' ? '#000' : '#fff',
                            fontWeight: 800,
                            fontSize: '1rem',
                            flexShrink: 0,
                        }}
                    >
                        {lib.icon}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {lib.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {lib.language}
                        </Typography>
                    </Box>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {lib.description}
                </Typography>

                {/* Install command */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <TerminalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: isAvailable ? 'text.primary' : 'text.disabled',
                        }}
                    >
                        {lib.installCommand}
                    </Typography>
                </Paper>

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Actions */}
                {isAvailable ? (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<CodeIcon />}
                            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            href={lib.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                            href={lib.registryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {lib.registryLabel}
                        </Button>
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        Stay tuned for updates
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default function LibrariesView() {
    const available = libraries.filter((l) => l.status === 'available');
    const comingSoon = libraries.filter((l) => l.status === 'coming_soon');

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LibraryBooksIcon color="primary" /> Libraries
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
                Use airport data in your own projects with our open-source client libraries.
                Each library provides the same comprehensive dataset with a native, idiomatic API for its language.
            </Typography>

            {/* Available */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                Available Now
            </Typography>
            <Grid container spacing={3} sx={{ mb: 5 }}>
                {available.map((lib) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 6 }} key={lib.name}>
                        <LibraryCard lib={lib} />
                    </Grid>
                ))}
            </Grid>

            {/* Coming soon */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                Coming Soon
            </Typography>
            <Grid container spacing={3}>
                {comingSoon.map((lib) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 6 }} key={lib.name}>
                        <LibraryCard lib={lib} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
