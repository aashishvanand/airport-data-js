'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Box, useTheme, Paper } from '@mui/material';
import { Airport } from '../types';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic import for Leaflet components with explicit typing
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);
const Polyline = dynamic(
    () => import('react-leaflet').then((mod) => mod.Polyline),
    { ssr: false }
);

// Dynamic import for useMap hook (used for programmatic view changes)
const MapViewUpdater = dynamic(
    () => import('react-leaflet').then((mod) => {
        // Create a small component that uses useMap to update view
        const { useMap } = mod;
        function ViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
            const map = useMap();
            useEffect(() => {
                map.setView(center, zoom);
            }, [center, zoom, map]);
            return null;
        }
        return ViewUpdater;
    }),
    { ssr: false }
);

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    markers: Airport[];
    route?: [number, number][]; // Array of coordinates for polyline
}

const createFlightIcon = (isDarkMode: boolean) => {
    if (typeof window === 'undefined') return null;
    // We need to require leaflet on client side only
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet');

    return new L.DivIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isDarkMode ? '#60a5fa' : '#2563eb'}" width="32px" height="32px" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
        className: 'custom-flight-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

export default React.memo(function MapComponent({ center, zoom, markers, route }: MapComponentProps) {
    const theme = useTheme();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Memoize the flight icon so it's only recreated when theme mode changes, not per marker per render
    const flightIcon = useMemo(
        () => createFlightIcon(theme.palette.mode === 'dark'),
        [theme.palette.mode]
    );

    if (!isMounted) return <Box sx={{ height: 400, bgcolor: 'background.paper', borderRadius: 4 }} />;

    return (
        <Paper sx={{ p: 1, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ height: 450, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
                {/* @ts-ignore - React Leaflet types can be tricky with dynamic imports */}
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                >
                    {/* Programmatically update view instead of destroying/recreating MapContainer via key */}
                    {/* @ts-ignore */}
                    <MapViewUpdater center={center} zoom={zoom} />
                    {/* @ts-ignore */}
                    <TileLayer
                        url={theme.palette.mode === 'dark'
                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'} // Premium looking map tiles
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {markers.map((airport, index) => (
                        airport.latitude && airport.longitude ? (
                            // @ts-ignore
                            <Marker
                                key={`${airport.iata}-${airport.icao}-${index}`}
                                position={[Number(airport.latitude), Number(airport.longitude)]}
                                icon={flightIcon}
                            >
                                {/* @ts-ignore */}
                                <Popup>
                                    <div style={{ fontFamily: theme.typography.fontFamily }}>
                                        <strong>{airport.airport}</strong><br />
                                        <span style={{ color: '#666' }}>{airport.iata} / {airport.icao}</span><br />
                                        {[airport.city, airport.country_code].filter(Boolean).join(', ')}
                                    </div>
                                </Popup>
                            </Marker>
                        ) : null
                    ))}

                    {route && route.length > 0 && (
                        // @ts-ignore
                        <Polyline
                            positions={route}
                            color={theme.palette.primary.main}
                            weight={4}
                            opacity={0.7}
                            dashArray="10, 10"
                        />
                    )}
                </MapContainer>
            </Box>
        </Paper>
    );
});
