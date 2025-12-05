
export interface Airport {
    iata: string;
    icao: string;
    airport: string;
    latitude: string | number;
    longitude: string | number;
    country_code: string;
    continent: string;
    type: string;
    time?: string;
    runway_length?: string;
    elevation?: string;
    scheduled_service?: boolean;
    website?: string;
    wikipedia?: string;
    flightradar24_url?: string;
    radarbox_url?: string;
    flightaware_url?: string;
    city?: string;
}

export type SearchType = 'iata' | 'icao' | 'name' | 'country' | 'continent' | 'type' | 'timezone';
