'use client';

import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { Airport } from '../types';
import LanguageIcon from '@mui/icons-material/Language';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RadarIcon from '@mui/icons-material/Radar';
import FlightIcon from '@mui/icons-material/Flight';

interface ExternalLinksProps {
    airport: Airport;
    extraLinks?: Record<string, string>;
}

// Hoisted to module scope — stable reference, never recreated
const linkTypes = [
    { key: 'website', label: 'Website', icon: <LanguageIcon fontSize="small" /> },
    { key: 'wikipedia', label: 'Wikipedia', icon: <MenuBookIcon fontSize="small" /> },
    { key: 'flightradar24_url', label: 'FlightRadar24', icon: <RadarIcon fontSize="small" /> },
    { key: 'radarbox_url', label: 'RadarBox', icon: <RadarIcon fontSize="small" /> },
    { key: 'flightaware_url', label: 'FlightAware', icon: <FlightIcon fontSize="small" /> }
];

// Data-sourced URLs must be validated before use as an href — a javascript:/data: value
// from the dataset would otherwise execute in the viewer's context on click.
const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);

export default React.memo(function ExternalLinks({ airport, extraLinks = {} }: ExternalLinksProps) {
    const hasLinks = linkTypes.some(({ key }) => {
        const url = airport[key as keyof Airport] || extraLinks[key.replace('_url', '')];
        return url && isSafeUrl(url as string);
    });

    if (!hasLinks) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                External Resources
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {linkTypes.map(({ key, label, icon }) => {
                    const rawUrl = airport[key as keyof Airport] || extraLinks[key.replace('_url', '')];
                    const url = rawUrl && isSafeUrl(rawUrl as string) ? rawUrl : null;
                    return url ? (
                        <Chip
                            key={key}
                            label={label}
                            icon={icon}
                            component="a"
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            clickable
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.75rem',
                                borderRadius: '8px',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                }
                            }}
                        />
                    ) : null;
                })}
            </Box>
        </Box>
    );
});
