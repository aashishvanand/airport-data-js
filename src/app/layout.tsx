import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { Providers } from './providers'
import { MicrosoftClarity } from './MicrosoftClarity'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const siteUrl = 'https://airportdata.dev'

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Airport Data | Global Airport Search & Aviation Data Explorer',
        template: '%s | Airport Data',
    },
    description: 'Search 18,000+ airports worldwide by IATA/ICAO code, name, country, continent, or timezone. Explore statistics, calculate distances, find nearby airports, and plan multi-city trips — powered by the airport-data-js library.',
    keywords: ['airport data', 'IATA code lookup', 'ICAO code lookup', 'airport search', 'aviation data', 'airport-data-js', 'flight distance calculator', 'nearby airports'],
    authors: [{ name: 'Aashish Vivekanand' }],
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    openGraph: {
        type: 'website',
        url: siteUrl,
        siteName: 'Airport Data',
        title: 'Airport Data | Global Airport Search & Aviation Data Explorer',
        description: 'Search 18,000+ airports worldwide by IATA/ICAO code, name, country, continent, or timezone.',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Airport Data' }],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@airportdatajs',
        title: 'Airport Data | Global Airport Search & Aviation Data Explorer',
        description: 'Search 18,000+ airports worldwide by IATA/ICAO code, name, country, continent, or timezone.',
        images: ['/og-image.png'],
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head />
            <body>
                <InitColorSchemeScript defaultMode="system" />
                <Providers>{children}</Providers>
                <MicrosoftClarity />
            </body>
        </html>
    )
}