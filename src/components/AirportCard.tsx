'use client';

import { Card, CardContent, Typography, Box, Chip, Tooltip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TerrainIcon from '@mui/icons-material/Terrain';
import StraightIcon from '@mui/icons-material/Straight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { Airport } from '../types';
import ExternalLinks from './ExternalLinks';

interface AirportCardProps {
    airport: Airport;
    extraLinks?: Record<string, string>;
}

export default function AirportCard({ airport, extraLinks }: AirportCardProps) {
    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 12px 24px -8px rgba(0, 0, 0, 0.6)'
                    : '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
                borderColor: 'primary.main',
            }
        }}>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" component="h2" sx={{
                            lineHeight: 1.2,
                            mb: 1,
                            fontWeight: 700
                        }}>
                            {airport.airport}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                            <LocationOnIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                            <Typography variant="body2">{[airport.city, airport.country_code].filter(Boolean).join(', ')}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                        <Chip
                            label={airport.iata || 'N/A'}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: '6px', minWidth: 50 }}
                        />
                        <Chip
                            label={airport.icao || 'N/A'}
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: '6px', minWidth: 50, borderColor: 'divider' }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <Chip
                        icon={<PublicIcon sx={{ fontSize: '1rem !important' }} />}
                        label={airport.continent}
                        size="small"
                        sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}
                    />
                    <Chip
                        label={airport.type?.replace('_', ' ') || 'Unknown'}
                        size="small"
                        sx={{ bgcolor: 'action.hover', borderRadius: '8px', textTransform: 'capitalize' }}
                    />
                    <Tooltip title={airport.scheduled_service ? "Scheduled Service Available" : "No Scheduled Service"}>
                        <Chip
                            icon={airport.scheduled_service ? <CheckCircleIcon sx={{ fontSize: '1rem !important' }} /> : <CancelIcon sx={{ fontSize: '1rem !important' }} />}
                            label={airport.scheduled_service ? 'Active' : 'Inactive'}
                            size="small"
                            color={airport.scheduled_service ? 'success' : 'default'}
                            variant={airport.scheduled_service ? 'filled' : 'outlined'}
                            sx={{ borderRadius: '8px' }}
                        />
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <AccessTimeIcon sx={{ fontSize: '0.9rem' }} /> Timezone
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                            {airport.time || 'N/A'}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <StraightIcon sx={{ fontSize: '0.9rem', transform: 'rotate(90deg)' }} /> Runway
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                            {airport.runway_length ? `${airport.runway_length} ft` : 'N/A'}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <TerrainIcon sx={{ fontSize: '0.9rem' }} /> Elevation
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                            {airport.elevation ? `${airport.elevation} ft` : 'N/A'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <LocationOnIcon sx={{ fontSize: '0.9rem' }} /> Coordinates
                        </Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                            {Number(airport.latitude).toFixed(2)}, {Number(airport.longitude).toFixed(2)}
                        </Typography>
                    </Box>
                </Box>

                <ExternalLinks airport={airport} extraLinks={extraLinks} />
            </CardContent>
        </Card>
    );
}
