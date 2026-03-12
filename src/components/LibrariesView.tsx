'use client';

import React from 'react';
import {
    Typography, Box, Card, CardContent, Grid, Button, Paper, Stack
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CodeIcon from '@mui/icons-material/Code';
import TerminalIcon from '@mui/icons-material/Terminal';


interface Library {
    name: string;
    language: string;
    description: string;
    packageName: string;
    installCommand: string;
    githubUrl: string;
    registryUrl: string;
    registryLabel: string;
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
        icon: 'PY',
        color: '#3776ab',
    },
    {
        name: 'airport_data',
        language: 'Dart / Flutter',
        description: 'Airport data library for Dart and Flutter applications. Build cross-platform mobile, web, and desktop apps with comprehensive airport search and lookup capabilities.',
        packageName: 'airport_data',
        installCommand: 'dart pub add airport_data',
        githubUrl: 'https://github.com/aashishvanand/airport-data-dart',
        registryUrl: 'https://pub.dev/packages/airport_data',
        registryLabel: 'pub.dev',
        icon: 'DT',
        color: '#0175c2',
    },
    {
        name: 'airport-data',
        language: 'Rust',
        description: 'High-performance airport data library for Rust. Leverage Rust\'s speed and safety for aviation data lookups in CLI tools, web servers, and embedded systems.',
        packageName: 'airport-data',
        installCommand: 'cargo add airport-data',
        githubUrl: 'https://github.com/aashishvanand/airport-data-rust',
        registryUrl: 'https://crates.io/crates/airport-data',
        registryLabel: 'crates.io',
        icon: 'RS',
        color: '#dea584',
    },
    {
        name: 'AirportData',
        language: 'Swift',
        description: 'Airport data library for Swift and Apple platforms. Build native iOS, macOS, tvOS, and watchOS apps with comprehensive airport search, distance calculation, and nearby airport lookup. Zero external dependencies.',
        packageName: 'AirportData',
        installCommand: '.package(url: "...airport-data-swift.git", from: "1.0.0")',
        githubUrl: 'https://github.com/aashishvanand/airport-data-swift',
        registryUrl: 'https://swiftpackageindex.com/aashishvanand/airport-data-swift',
        registryLabel: 'Swift Package Index',
        icon: 'SW',
        color: '#f05138',
    },
    {
        name: 'airport-data-go',
        language: 'Go',
        description: 'Airport data library for Go applications. Leverage Go\'s performance and simplicity for aviation data lookups in web servers, CLI tools, and microservices. Data embedded at compile time via go:embed.',
        packageName: 'airport-data-go',
        installCommand: 'go get github.com/aashishvanand/airport-data-go',
        githubUrl: 'https://github.com/aashishvanand/airport-data-go',
        registryUrl: 'https://pkg.go.dev/github.com/aashishvanand/airport-data-go',
        registryLabel: 'pkg.go.dev',
        icon: 'GO',
        color: '#00add8',
    },
    {
        name: 'airport-data',
        language: 'Kotlin',
        description: 'Airport data library for Kotlin and JVM applications. Build Android apps, backend services with Ktor or Spring, and multiplatform projects with comprehensive airport search and lookup capabilities.',
        packageName: 'dev.airportdata:airport-data',
        installCommand: 'implementation("dev.airportdata:airport-data:1.0.0")',
        githubUrl: 'https://github.com/aashishvanand/airport-data-kotlin',
        registryUrl: 'https://central.sonatype.com/artifact/dev.airportdata/airport-data',
        registryLabel: 'Maven Central',
        icon: 'KT',
        color: '#7f52ff',
    },
];

function LibraryCard({ lib }: { lib: Library }) {
    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
            }}
        >
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
                            color: 'text.primary',
                        }}
                    >
                        {lib.installCommand}
                    </Typography>
                </Paper>

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Actions */}
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
            </CardContent>
        </Card>
    );
}

export default function LibrariesView() {
    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LibraryBooksIcon color="primary" /> Libraries
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
                Use airport data in your own projects with our open-source client libraries.
                Each library provides the same comprehensive dataset with a native, idiomatic API for its language.
            </Typography>

            <Grid container spacing={3}>
                {libraries.map((lib) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 6 }} key={lib.name}>
                        <LibraryCard lib={lib} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
