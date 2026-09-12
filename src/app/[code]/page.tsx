import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Box, Container, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAirportByIata, getAirportByIcao } from 'airport-data-js';
import { Airport } from '../../types';
import AirportCard from '../../components/AirportCard';

interface PageProps {
    params: Promise<{ code: string }>;
}

const CODE_PATTERN = /^[A-Za-z]{3,4}$/;

// This route is intentionally left off generateStaticParams — with SSR already running
// on the Worker for every other route, per-request rendering here gets full indexability
// (crawlers see server-rendered HTML for any of the ~18,771 airports) without needing to
// pre-build that many static files (Cloudflare Workers deployments cap file counts).
async function resolveAirport(rawCode: string): Promise<Airport | null> {
    if (!CODE_PATTERN.test(rawCode)) return null;
    const code = rawCode.toUpperCase();
    try {
        const res = code.length === 3 ? await getAirportByIata(code) : await getAirportByIcao(code);
        const airport = Array.isArray(res) ? res[0] : res;
        return airport ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code } = await params;
    const airport = await resolveAirport(code);

    if (!airport) {
        return { title: 'Airport Not Found' };
    }

    // Prefer IATA as the canonical code/URL when an airport has both — avoids indexing
    // the same airport twice under /MAA and /VOMM as separate, duplicate-content pages.
    const primaryCode = airport.iata || airport.icao;
    const codesLabel = [
        airport.iata ? `IATA: ${airport.iata}` : null,
        airport.icao ? `ICAO: ${airport.icao}` : null,
    ].filter(Boolean).join(', ');

    const title = `${primaryCode} – ${airport.airport}`;
    const description = `${airport.airport} (${codesLabel}) in ${airport.country_code}. ${(airport.type || '').replace(/_/g, ' ')}${airport.elevation_ft ? `, elevation ${airport.elevation_ft} ft` : ''}. Timezone: ${airport.time || 'N/A'}. Coordinates: ${Number(airport.latitude).toFixed(4)}, ${Number(airport.longitude).toFixed(4)}.`;

    return {
        title,
        description,
        alternates: { canonical: `/${primaryCode}` },
        openGraph: {
            title: `${title} | Airport Data`,
            description,
            url: `/${primaryCode}`,
        },
        twitter: {
            card: 'summary',
            title: `${title} | Airport Data`,
            description,
        },
    };
}

export default async function AirportCodePage({ params }: PageProps) {
    const { code } = await params;
    const airport = await resolveAirport(code);

    if (!airport) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Airport',
        name: airport.airport,
        ...(airport.iata ? { iataCode: airport.iata } : {}),
        ...(airport.icao ? { icaoCode: airport.icao } : {}),
        address: {
            '@type': 'PostalAddress',
            addressCountry: airport.country_code,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: Number(airport.latitude),
            longitude: Number(airport.longitude),
        },
        ...(airport.website ? { url: airport.website } : {}),
        ...(airport.wikipedia ? { sameAs: airport.wikipedia } : {}),
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, sm: 6 } }}>
            {/* JSON.stringify-encoded structured data; no raw user input reaches this */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Container maxWidth="sm">
                <Button component={Link} href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
                    Back to Search
                </Button>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    {airport.airport}
                </Typography>
                <Box sx={{ mb: 3 }}>
                    <AirportCard airport={airport} />
                </Box>
                <Button
                    component={Link}
                    href={`/?q=${encodeURIComponent(airport.iata || airport.icao)}`}
                    variant="outlined"
                >
                    Open in interactive search
                </Button>
            </Container>
        </Box>
    );
}
