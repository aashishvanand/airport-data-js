import type { Airport, AirportSearchResult, AirportLocalTime } from '../types/index';

const lib = require('../lib/index.js');
const lite = require('../lib/lite.js');

describe('Data fixes', () => {
    test('OGG is in Oceania like the other Hawaiian airports', async () => {
        const [ogg]: Airport[] = await lib.getAirportByIata('OGG');
        expect(ogg.continent).toBe('OC');
    });

    test('every airport has a valid IANA time zone', async () => {
        const all: Airport[] = await lib.findAirports({});
        const zones = new Set(all.map(a => a.time));
        for (const tz of zones) {
            expect(() => new Intl.DateTimeFormat('en-US', { timeZone: tz })).not.toThrow();
        }
        const [kkm]: Airport[] = await lib.getAirportByIata('KKM');
        expect(kkm.time).toBe('Asia/Bangkok');
    });

    test('McKinney National uses DTX with corrected coordinates', async () => {
        const [tki]: Airport[] = await lib.getAirportByIcao('KTKI');
        expect(tki.iata).toBe('DTX');
        expect(tki.longitude).toBeCloseTo(-96.59, 1);
        expect(tki.elevation_ft).toBe(585);
        expect(await lib.validateIataCode('QQT')).toBe(false);
    });

    test.each([
        ['FSH', 'WIMI', 'ID'],
        ['BZJ', 'ZSBO', 'CN'],
        ['DEJ', 'ZUDJ', 'CN'],
        ['DHH', 'ZWLK', 'CN'],
        ['BQR', 'WAFQ', 'ID'],
        ['LTH', 'VVLT', 'VN'],
        ['QHR', 'HAHM', 'ET'],
    ])('%s (%s) is present', async (iata, icao, country) => {
        const [airport]: Airport[] = await lib.getAirportByIata(iata);
        expect(airport.icao).toBe(icao);
        expect(airport.country_code).toBe(country);
    });

    test('East Hampton is one record with IATA HTO', async () => {
        const [hto]: Airport[] = await lib.getAirportByIata('HTO');
        expect(hto.icao).toBe('KJPX');
        expect(await lib.validateIataCode('JPX')).toBe(false);
        expect(await lib.validateIcaoCode('KHTO')).toBe(false);
    });

    test('Wodgina: GYB is the new airport, the old strip is closed', async () => {
        const [gyb]: Airport[] = await lib.getAirportByIata('GYB');
        expect(gyb.icao).toBe('YWGA');
        const [old]: Airport[] = await lib.getAirportByIcao('YWDC');
        expect(old.type).toBe('closed');
        expect(await lib.validateIataCode('QBW')).toBe(false);
    });

    test('Fuyong ferry port no longer borrows a US ICAO code', async () => {
        const [fyg]: Airport[] = await lib.getAirportByIata('FYG');
        expect(fyg.icao).toBe('');
    });

    test('iata and icao are always strings', async () => {
        const all: Airport[] = await lib.findAirports({});
        expect(all.every(a => typeof a.iata === 'string' && typeof a.icao === 'string')).toBe(true);
    });
});

describe('City fields and lookups', () => {
    test('records carry city and city_code', async () => {
        const [jfk]: Airport[] = await lib.getAirportByIata('JFK');
        expect(jfk.city).toBe('New York');
        expect(jfk.city_code).toBe('NYC');
    });

    test('getAirportsByCity is case/accent-insensitive and puts major airports first', async () => {
        const london: Airport[] = await lib.getAirportsByCity('london');
        expect(london[0].iata).toBe('LHR');
        const sp1: Airport[] = await lib.getAirportsByCity('São Paulo');
        const sp2: Airport[] = await lib.getAirportsByCity('sao paulo');
        expect(sp1.map(a => a.iata)).toEqual(sp2.map(a => a.iata));
        expect(sp1.some(a => a.iata === 'GRU')).toBe(true);
    });

    test('getAirportsByCity matches the base city of qualified municipalities', async () => {
        const paris: Airport[] = await lib.getAirportsByCity('Paris');
        expect(paris.map(a => a.iata)).toEqual(expect.arrayContaining(['CDG', 'ORY']));
    });

    test('getAirportsByCity validates input', async () => {
        await expect(lib.getAirportsByCity('')).rejects.toThrow();
        expect(await lib.getAirportsByCity('Nowhereville Zzz')).toEqual([]);
    });

    test('getAirportsByCityCode returns metro airports', async () => {
        const nyc: Airport[] = await lib.getAirportsByCityCode('NYC');
        expect(nyc.map(a => a.iata)).toEqual(expect.arrayContaining(['JFK', 'LGA', 'EWR']));
        const lon: Airport[] = await lib.getAirportsByCityCode('LON');
        expect(lon[0].iata).toBe('LHR');
        await expect(lib.getAirportsByCityCode('nyc')).rejects.toThrow();
    });

    test('findAirports accepts city filters', async () => {
        const result: Airport[] = await lib.findAirports({ city_code: 'NYC', type: 'large_airport' });
        expect(result.map(a => a.iata).sort()).toEqual(['EWR', 'JFK', 'LGA']);
    });
});

describe('search', () => {
    const codes = (r: AirportSearchResult[]) => r.map(a => a.iata);

    test('exact IATA and ICAO rank first', async () => {
        expect((await lib.search('SIN'))[0].iata).toBe('SIN');
        const [egll]: AirportSearchResult[] = await lib.search('egll');
        expect(egll.iata).toBe('LHR');
        expect(egll.matchType).toBe('icao');
    });

    test('city queries return the metro airports, not just name matches', async () => {
        const ny: AirportSearchResult[] = await lib.search('New York');
        expect(codes(ny).slice(0, 3).sort()).toEqual(['EWR', 'JFK', 'LGA']);
        const tokyo: AirportSearchResult[] = await lib.search('tokyo');
        expect(codes(tokyo).slice(0, 2).sort()).toEqual(['HND', 'NRT']);
    });

    test('metro codes expand to all airports', async () => {
        const lon: AirportSearchResult[] = await lib.search('LON');
        expect(codes(lon).slice(0, 5)).toEqual(expect.arrayContaining(['LHR', 'LGW', 'STN', 'LTN', 'LCY']));
    });

    test('accent-insensitive and typo-tolerant', async () => {
        expect((await lib.search('Zürich'))[0].iata).toBe('ZRH');
        expect((await lib.search('zurich'))[0].iata).toBe('ZRH');
        const typo: AirportSearchResult[] = await lib.search('frankfrut');
        expect(typo[0].iata).toBe('FRA');
        expect(typo[0].matchType).toBe('fuzzy');
        expect(await lib.search('frankfrut', { fuzzy: false })).toEqual([]);
    });

    test('former and alternative city names', async () => {
        expect((await lib.search('bangalore'))[0].iata).toBe('BLR');
        expect((await lib.search('bombay'))[0].iata).toBe('BOM');
        expect(codes(await lib.search('peking', { limit: 2 })).sort()).toEqual(['PEK', 'PKX']);
        expect((await lib.search('athens'))[0].iata).toBe('ATH');
        const roma: Airport[] = await lib.getAirportsByCity('Roma');
        expect(roma.map(a => a.iata)).toEqual(expect.arrayContaining(['FCO', 'CIA']));
    });

    test('options filter and limit results', async () => {
        const r: AirportSearchResult[] = await lib.search('paris', { scheduledOnly: true, country_code: 'FR', limit: 2 });
        expect(r).toHaveLength(2);
        expect(codes(r).sort()).toEqual(['CDG', 'ORY']);
        const large: AirportSearchResult[] = await lib.search('london', { types: ['large_airport'] });
        expect(large.every(a => a.type === 'large_airport')).toBe(true);
    });

    test('results are sorted by score', async () => {
        const r: AirportSearchResult[] = await lib.search('london', { limit: 20 });
        for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
    });

    test('validates input', async () => {
        await expect(lib.search('a')).rejects.toThrow();
        await expect(lib.search('x'.repeat(101))).rejects.toThrow();
        await expect(lib.search('london', { limit: 0 })).rejects.toThrow();
    });

    test('searchByName is accent-insensitive', async () => {
        const r: Airport[] = await lib.searchByName('Zurich');
        expect(r.some(a => a.iata === 'ZRH')).toBe(true);
    });

    test('autocomplete ranks by city and importance', async () => {
        const r: Airport[] = await lib.getAutocompleteSuggestions('new york');
        expect(r.slice(0, 3).map(a => a.iata).sort()).toEqual(['EWR', 'JFK', 'LGA']);
        expect(r.length).toBeLessThanOrEqual(10);
        expect(await lib.getAutocompleteSuggestions('a')).toEqual([]);
    });
});

describe('Time zone helpers', () => {
    test('getUtcOffset follows DST', async () => {
        expect(await lib.getUtcOffset('JFK', '2026-07-01T12:00:00Z')).toBe(-4);
        expect(await lib.getUtcOffset('JFK', '2026-12-01T12:00:00Z')).toBe(-5);
        expect(await lib.getUtcOffset('KJFK', new Date('2026-12-01T12:00:00Z'))).toBe(-5);
        expect(await lib.getUtcOffset('DEL', Date.UTC(2026, 0, 1))).toBe(5.5);
        expect(await lib.getUtcOffset('KTM')).toBe(5.75);
        expect(await lib.getUtcOffset('ZZZ')).toBeNull();
    });

    test('getUtcOffset handles the southern hemisphere', async () => {
        expect(await lib.getUtcOffset('SYD', '2026-01-15T00:00:00Z')).toBe(11);
        expect(await lib.getUtcOffset('SYD', '2026-07-15T00:00:00Z')).toBe(10);
    });

    test('getLocalTime returns wall-clock time and DST flag', async () => {
        const t: AirportLocalTime = await lib.getLocalTime('LHR', '2026-07-01T12:00:00Z');
        expect(t).toEqual({
            timeZone: 'Europe/London',
            iso: '2026-07-01T13:00:00+01:00',
            date: '2026-07-01',
            time: '13:00:00',
            utcOffset: 1,
            utcOffsetString: '+01:00',
            isDst: true,
        });
        const winter: AirportLocalTime = await lib.getLocalTime('LHR', '2026-12-01T12:00:00Z');
        expect(winter.isDst).toBe(false);
        expect(winter.utcOffsetString).toBe('+00:00');
        const syd: AirportLocalTime = await lib.getLocalTime('SYD', '2026-01-15T00:00:00Z');
        expect(syd.isDst).toBe(true);
        const nfld: AirportLocalTime = await lib.getLocalTime('YYT', '2026-01-15T12:00:00Z');
        expect(nfld.utcOffsetString).toBe('-03:30');
        expect(await lib.getLocalTime('ZZZ')).toBeNull();
    });

    test('getLocalTime crosses the date line correctly', async () => {
        const t: AirportLocalTime = await lib.getLocalTime('AKL', '2026-11-10T20:00:00Z');
        expect(t.date).toBe('2026-11-11');
    });

    test('formatAirportTime uses Intl formatting in the airport zone', async () => {
        // ICU may put a narrow no-break space before AM/PM; normalize whitespace.
        const nrt: string = await lib.formatAirportTime('NRT', { date: '2026-11-10T00:00:00Z' });
        expect(nrt.replace(/\s/g, ' ')).toBe('Nov 10, 2026, 9:00 AM');
        expect(await lib.formatAirportTime('CDG', { locale: 'fr-FR', timeStyle: 'short', date: '2026-11-10T13:05:00Z' })).toBe('14:05');
        expect(await lib.formatAirportTime('ZZZ')).toBeNull();
    });

    test('rejects invalid dates', async () => {
        await expect(lib.getUtcOffset('JFK', 'not a date')).rejects.toThrow('Invalid date');
    });

    test('the static utc field is mismatched for DST zones, which is why the helpers exist', async () => {
        const [jfk]: Airport[] = await lib.getAirportByIata('JFK');
        expect(jfk.utc).toBe(-4);
        expect(await lib.getUtcOffset('JFK', '2026-11-10T12:00:00Z')).toBe(-5);
    });
});

describe('lite entry point', () => {
    test('exposes the same API', () => {
        const fullKeys = Object.keys(lib).sort();
        expect(Object.keys(lite).sort()).toEqual(fullKeys);
    });

    test('only includes airports with an IATA code and no URL fields', async () => {
        const all: Airport[] = await lite.findAirports({});
        expect(all.length).toBeGreaterThan(10000);
        expect(all.every(a => a.iata)).toBe(true);
        const [lhr]: Airport[] = await lite.getAirportByIata('LHR');
        expect(lhr.city).toBe('London');
        expect(lhr.wikipedia).toBeUndefined();
        expect(lhr.flightradar24_url).toBeUndefined();
    });

    test('search and time helpers work', async () => {
        const ny: AirportSearchResult[] = await lite.search('new york');
        expect(ny[0].iata).toBe('JFK');
        expect(await lite.getUtcOffset('JFK', '2026-12-01T12:00:00Z')).toBe(-5);
    });
});

describe('ESM entry points', () => {
    test('index.mjs, lite.mjs and tools.mjs import and match the CJS API', async () => {
        const esm = await import('../lib/index.mjs');
        const esmLite = await import('../lib/lite.mjs');
        const esmTools = await import('../lib/tools.mjs');
        expect(Object.keys(esm).filter(k => k !== 'default').sort()).toEqual(Object.keys(lib).sort());
        expect((await esm.getAirportByIata('LHR'))[0].city).toBe('London');
        expect((await esmLite.search('LHR'))[0].iata).toBe('LHR');
        expect(Array.isArray(esmTools.airportTools)).toBe(true);
    });
});
