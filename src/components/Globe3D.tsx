'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@mui/material/styles';
import { Airport } from '../types';

// Dynamic import for Globe as it relies on window/webgl
const Globe = dynamic(() => import('react-globe.gl'), {
    ssr: false,
    loading: () => <div>Loading Globe...</div>
});

interface Globe3DProps {
    airports: Airport[];
    route: [number, number][]; // Array of [lat, lng]
}

export default function Globe3D({ airports, route }: Globe3DProps) {
    const theme = useTheme();
    const globeEl = useRef<any>(null);
    const [pointsData, setPointsData] = useState<any[]>([]);
    const [arcsData, setArcsData] = useState<any[]>([]);

    useEffect(() => {
        // Prepare data for the globe
        const points = airports.map(a => ({
            lat: Number(a.latitude),
            lng: Number(a.longitude),
            name: a.airport,
            code: a.iata || a.icao,
            color: theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
            radius: 0.5
        }));
        setPointsData(points);

        if (airports.length > 1) {
            const arcs = [];
            for (let i = 0; i < airports.length - 1; i++) {
                arcs.push({
                    startLat: Number(airports[i].latitude),
                    startLng: Number(airports[i].longitude),
                    endLat: Number(airports[i + 1].latitude),
                    endLng: Number(airports[i + 1].longitude),
                    color: theme.palette.primary.main
                });
            }
            setArcsData(arcs);
        } else {
            setArcsData([]);
        }
    }, [airports, theme, route]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions(); // Initial measurement

        // Slight delay to ensure parent container has rendered valid width
        setTimeout(updateDimensions, 100);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        // Auto-rotate or position
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;

            // If we have points, try to center on the first one or the whole route
            if (pointsData.length > 0) {
                const first = pointsData[0];
                globeEl.current.pointOfView({ lat: first.lat, lng: first.lng, altitude: 2.0 }, 1000);
            }
        }
    }, [pointsData]);

    return (
        <div ref={containerRef} style={{ height: '70vh', minHeight: 600, borderRadius: 12, overflow: 'hidden', width: '100%' }}>
            {/* @ts-ignore */}
            <Globe
                ref={globeEl}
                globeImageUrl={theme.palette.mode === 'dark'
                    ? "https://unpkg.com/three-globe/example/img/earth-dark.jpg"
                    : "https://unpkg.com/three-globe/example/img/earth-day.jpg"
                }
                bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)" // Transparent to blend with app background
                width={dimensions.width}
                height={dimensions.height}
                pointsData={pointsData}
                pointLabel={(d: any) => `${d.name} (${d.code})`}
                pointColor="color"
                pointAltitude={0.01}
                pointRadius="radius"
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.5}
                arcDashGap={0.5}
                arcDashAnimateTime={2000}
                arcStroke={0.5}
            />
        </div>
    );
}
