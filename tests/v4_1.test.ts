import type { Airport, AirportSearchResult, AirportLocalTime } from '../types/index';

const lib = require('../lib/index.js');
const lite = require('../lib/lite.js');

describe('Data fixes', () => {
    test('OGG is in Oceania like the other Hawaiian airports', async () => {
        const [ogg]: Airport[] = await lib.getAirportByIata('OGG');
        expect(ogg.continent).toBe('OC');
    });

    test('every Hawaiian airport is in Oceania (#195)', async () => {
        const hawaii: Airport[] = (await lib.findAirports({ country_code: 'US' })).filter((a: Airport) =>
            a.latitude > 18 && a.latitude < 29 && a.longitude > -179 && a.longitude < -154);
        expect(hawaii.length).toBeGreaterThan(20);
        expect(hawaii.filter(a => a.continent !== 'OC').map(a => a.iata || a.icao)).toEqual([]);
    });

    test('each country has one continent, except countries split by geography', async () => {
        const all: Airport[] = await lib.findAirports({});
        const byCountry = new Map<string, Set<string>>();
        for (const a of all) {
            if (a.latitude < -60) continue; // Antarctic stations are AN under their operator's country
            byCountry.set(a.country_code, (byCountry.get(a.country_code) ?? new Set()).add(a.continent));
        }
        const mixed = [...byCountry].filter(([, set]) => set.size > 1).map(([c]) => c).sort();
        expect(mixed).toEqual(['CO', 'EG', 'ES', 'RU', 'TR', 'US']);
    });

    test.each([
        ['HNL', 'OC'], ['OGG', 'OC'], ['JFK', 'NA'],
        ['SVO', 'EU'], ['KGD', 'EU'], ['OVB', 'AS'], ['VVO', 'AS'], ['DYR', 'AS'],
        ['IST', 'EU'], ['SAW', 'AS'], ['ESB', 'AS'],
        ['CAI', 'AF'], ['HRG', 'AF'], ['SSH', 'AS'],
        ['MAD', 'EU'], ['LPA', 'AF'], ['MLN', 'AF'],
        ['BOG', 'SA'], ['ADZ', 'NA'],
        ['RHO', 'EU'], ['NIC', 'AS'], ['QQK', 'EU'],
    ])('%s is in %s', async (iata, continent) => {
        const [airport]: Airport[] = await lib.getAirportByIata(iata);
        expect(airport.continent).toBe(continent);
    });

    test('US airports no longer carry data from airports that share their IATA code', async () => {
        const [qsi]: Airport[] = await lib.getAirportByIata('QSI'); // Moshi, Tanzania also uses QSI
        expect(qsi.continent).toBe('NA');
        expect(qsi.elevation_ft).toBe(236);
        expect(qsi.wikipedia).toBe('');
        const [qdy]: Airport[] = await lib.getAirportByIata('QDY');
        expect(qdy.airport).toBe('Ryan Field');
        expect(qdy.elevation_ft).toBe(2417);
    });

    test.each(['BYL', 'LNQ', 'SCA', 'LIJ'])('%s no longer uses an ICAO code from another country', async iata => {
        const [airport]: Airport[] = await lib.getAirportByIata(iata);
        expect(airport.icao).toBe('');
        expect(airport.flightaware_url).toBe('');
    });

    test('Icelandic airports are filed under Iceland', async () => {
        const [bisf]: Airport[] = await lib.getAirportByIcao('BISF');
        expect(bisf.country_code).toBe('IS');
        expect(bisf.continent).toBe('EU');
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
        expect((await lib.getAirportsByCityCode('nyc')).length).toBeGreaterThan(1);
        await expect(lib.getAirportsByCityCode('ny1')).rejects.toThrow(/city code/);
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
        // The .mjs bundles have no declaration files of their own.
        // @ts-expect-error - untyped built ESM bundle
        const esm = await import('../lib/index.mjs');
        // @ts-expect-error - untyped built ESM bundle
        const esmLite = await import('../lib/lite.mjs');
        // @ts-expect-error - untyped built ESM bundle
        const esmTools = await import('../lib/tools.mjs');
        expect(Object.keys(esm).filter(k => k !== 'default').sort()).toEqual(Object.keys(lib).sort());
        expect((await esm.getAirportByIata('LHR'))[0].city).toBe('London');
        expect((await esmLite.search('LHR'))[0].iata).toBe('LHR');
        expect(Array.isArray(esmTools.airportTools)).toBe(true);
    });
});

describe('Review fixes', () => {
    test('findNearbyAirports finds airports across the pole', async () => {
        // YLT (82.5, -62.3) is ~1388 km from (85, 117.72), on the other side of the North Pole
        const airports: Airport[] = await lib.findNearbyAirports(85, 117.72, 1450);
        expect(airports.some(a => a.iata === 'YLT')).toBe(true);
    });

    test('inherited object keys are not treated as city aliases', async () => {
        expect(await lib.search('constructor')).toEqual([]);
        expect(await lib.getAutocompleteSuggestions('constructor')).toEqual([]);
        expect(await lib.getAirportsByCity('constructor')).toEqual([]);
    });

    test('autocomplete matches ICAO prefixes', async () => {
        const suggestions: Airport[] = await lib.getAutocompleteSuggestions('EGL');
        expect(suggestions.some(a => a.icao === 'EGLL')).toBe(true);
    });

    test('search tool declares limit as an integer', () => {
        const { airportTools } = require('../lib/tools.js');
        const tool = airportTools.find((t: { name: string }) => t.name === 'search');
        expect(tool.parameters.properties.limit.type).toBe('integer');
    });

    test('JPN (Pentagon) is in the Washington DC metro area', async () => {
        const was: Airport[] = await lib.getAirportsByCityCode('WAS');
        expect(was.some(a => a.iata === 'JPN')).toBe(true);
    });

    test('ANM (Antsirabato) serves Antalaha', async () => {
        const [anm]: Airport[] = await lib.getAirportByIata('ANM');
        expect(anm.city).toBe('Antalaha');
    });
});

describe('Dataset URL fields', () => {
    test('every website and wikipedia value is empty or an http(s) URL', async () => {
        const all: Airport[] = await lib.findAirports({});
        const bad = all
            .flatMap(a => [['website', a.website], ['wikipedia', a.wikipedia]] as const)
            .filter(([, url]) => url && !/^https?:\/\/\S+$/i.test(url));
        expect(bad).toEqual([]);
    });
});

describe('Input validation and edge cases', () => {
    test('findAirports rejects non-finite numbers', async () => {
        await expect(lib.findAirports({ min_runway_ft: NaN })).rejects.toThrow(/finite number/);
        await expect(lib.findAirports({ latitude: Infinity })).rejects.toThrow(/finite number/);
        await expect(lib.findAirports({ elevation_ft: '100' })).rejects.toThrow(/finite number or null/);
    });

    test('findAirports accepts lowercase codes and boolean scheduled_service', async () => {
        const lower: Airport[] = await lib.findAirports({ country_code: 'us' });
        const upper: Airport[] = await lib.findAirports({ country_code: 'US' });
        expect(lower.length).toBe(upper.length);
        expect(lower.length).toBeGreaterThan(0);

        const viaBoolean: Airport[] = await lib.findAirports({ scheduled_service: true });
        const viaHas: Airport[] = await lib.findAirports({ has_scheduled_service: true });
        expect(viaBoolean.length).toBe(viaHas.length);
        expect(viaBoolean.length).toBeGreaterThan(0);
    });

    test('findAirports skips undefined values and rejects null', async () => {
        const all: Airport[] = await lib.findAirports({});
        expect((await lib.findAirports({ country_code: undefined })).length).toBe(all.length);
        await expect(lib.findAirports(null)).rejects.toThrow(/Invalid filters/);
    });

    test('search validates its options', async () => {
        await expect(lib.search('london', { types: 'large_airport' })).rejects.toThrow(/types/);
        await expect(lib.search('london', null)).rejects.toThrow(/Invalid options/);
        const lower: AirportSearchResult[] = await lib.search('paris', { country_code: 'fr' });
        expect(lower.length).toBeGreaterThan(0);
        expect(lower.every(a => a.country_code === 'FR')).toBe(true);
    });

    test('queries are validated after normalization', async () => {
        await expect(lib.search('a!')).rejects.toThrow(/at least 2/);
        await expect(lib.searchByName('a!')).rejects.toThrow(/at least 2/);
    });

    test('time helpers handle ancient and unsupported years', async () => {
        await expect(lib.getLocalTime('JFK', null)).rejects.toThrow(/null is not a date/);
        // Years 1-99 used to be mapped to 1900-1999 by Date.UTC; they now use the real year.
        const ancient: number = await lib.getUtcOffset('JFK', '0050-01-01T00:00:00Z');
        expect(Number.isFinite(ancient)).toBe(true);
        expect(Math.abs(ancient)).toBeLessThanOrEqual(14);
        await expect(lib.getUtcOffset('JFK', '0000-01-01T00:00:00Z')).rejects.toThrow(/before year 1/);
    });

    test('formatAirportTime wraps invalid Intl options', async () => {
        await expect(lib.formatAirportTime('JFK', { locale: 'en_US' })).rejects.toThrow(/Invalid date\/time format options/);
        await expect(lib.formatAirportTime('JFK', { dateStyle: 'short', year: 'numeric' })).rejects.toThrow(/Invalid date\/time format options/);
    });

    test('getLargestAirportsByContinent requires an integer limit', async () => {
        await expect(lib.getLargestAirportsByContinent('EU', 2.5)).rejects.toThrow(/integer/);
    });

    test('normalizes letters NFD does not decompose', async () => {
        const byName: Airport[] = await lib.searchByName('Tromsø');
        expect(byName.some(a => a.iata === 'TOS')).toBe(true);
        expect((await lib.search('Tromsø'))[0].iata).toBe('TOS');
    });

    test('Morocco is marked as DST during the Ramadan shift', async () => {
        const ramadan: AirportLocalTime = await lib.getLocalTime('CMN', '2026-03-05T12:00:00Z');
        expect(ramadan.utcOffset).toBe(0);
        expect(ramadan.isDst).toBe(true);
        const winter: AirportLocalTime = await lib.getLocalTime('CMN', '2026-01-15T12:00:00Z');
        expect(winter.isDst).toBe(false);
    });

    test('code lookups accept lowercase and padded input', async () => {
        expect((await lib.getAirportByIata('lhr'))[0].icao).toBe('EGLL');
        expect((await lib.getAirportByIata(' LHR '))[0].iata).toBe('LHR');
        expect((await lib.getAirportByIcao(' egll '))[0].iata).toBe('LHR');
        expect((await lib.getAirportByCountryCode('gb')).length).toBeGreaterThan(100);
        expect((await lib.getAirportByContinent('eu')).length).toBeGreaterThan(100);
        expect((await lib.getAirportsByCityCode('lon')).length).toBeGreaterThan(1);
        expect(await lib.validateIataCode('lhr')).toBe(true);
        expect(await lib.validateIcaoCode('egll')).toBe(true);
        expect((await lib.getAirportStatsByCountry('gb')).total).toBeGreaterThan(100);
        expect((await lib.getAirportStatsByContinent('eu')).total).toBeGreaterThan(100);
        expect((await lib.getLargestAirportsByContinent('eu', 1))[0].continent).toBe('EU');
        expect(await lib.calculateDistance('lhr', 'jfk')).toBeCloseTo(5541, -2);
        expect((await lib.getMultipleAirports(['lhr', 'EGLL']))[0]!.iata).toBe('LHR');
        expect((await lib.getAirportLinks('lhr'))!.website).toContain('heathrow');
        expect(await lib.getUtcOffset('jfk', '2026-01-15T12:00:00Z')).toBe(-5);
        expect((await lib.findNearestAirport(51.5074, -0.1278, { iata: 'lhr' }))!.iata).toBe('LHR');
    });

    test('code filters accept padded input', async () => {
        expect((await lib.findAirports({ iata: ' LHR ' }))[0].icao).toBe('EGLL');
        expect((await lib.findAirports({ icao: ' egll ' }))[0].iata).toBe('LHR');
        expect((await lib.findAirports({ country_code: ' gb ', type: ' Large_Airport ' })).length).toBeGreaterThan(5);
        expect((await lib.findAirports({ city_code: 'lon ' })).length).toBeGreaterThan(1);
        expect(await lib.getAirportCount({ continent: ' eu ' })).toBeGreaterThan(100);
        expect((await lib.search('london', { country_code: ' gb ' }))[0].country_code).toBe('GB');
    });

    test('FAA identifiers are stored separately from ICAO', async () => {
        const [ate]: Airport[] = await lib.getAirportByIata('ATE');
        expect(ate.icao).toBe('');
        expect(ate.faa_code).toBe('80F');
        expect(ate.radarbox_url).toBe('');
        const found: Airport[] = await lib.findAirports({ faa_code: '80F' });
        expect(found).toHaveLength(1);
    });
});

describe('Tool dispatcher', () => {
    test('executeTool maps schema arguments to library calls', async () => {
        const [lhr]: Airport[] = await lib.executeTool('getAirportByIata', { iataCode: 'LHR' }) as Airport[];
        expect(lhr.city).toBe('London');

        const results: AirportSearchResult[] = await lib.executeTool('search', { query: 'New York', limit: 3 }) as AirportSearchResult[];
        expect(results).toHaveLength(3);
        expect(results[0].iata).toBe('JFK');

        const nearby: Array<Airport & { distance: number }> = await lib.executeTool('findNearbyAirports', {
            lat: 51.5074, lon: -0.1278, radiusKm: 40,
        }) as Array<Airport & { distance: number }>;
        expect(nearby.some(a => a.iata === 'LHR')).toBe(true);

        const count: number = await lib.executeTool('getAirportCount', { country_code: 'GB' }) as number;
        expect(count).toBeGreaterThan(100);
    });

    test('executeTool rejects unknown tools', async () => {
        await expect(lib.executeTool('notATool', {})).rejects.toThrow(/Unknown tool: notATool/);
    });

    test('the dispatcher knows every tool in the schema', async () => {
        const { airportTools } = require('../lib/tools.js');
        const error: Error = await lib.executeTool('notATool', {}).catch((err: Error) => err);
        expect(error.message).toContain('Unknown tool: notATool');
        for (const tool of airportTools) {
            expect(error.message).toContain(tool.name);
        }
    });
});

describe('Browser bundle', () => {
    test('UMD bundle exposes the same API as the Node build', async () => {
        const umd = require('../dist/airport-data.min.js');
        expect(typeof umd.getAirportByIata).toBe('function');
        expect(typeof umd.executeTool).toBe('function');
        const [lhr]: Airport[] = await umd.getAirportByIata('LHR');
        expect(lhr.city).toBe('London');
        const [sin]: Airport[] = await umd.getAirportByIata('SIN');
        expect(sin.country_code).toBe('SG');
    });

    test('lite UMD bundle omits link fields', async () => {
        const umdLite = require('../dist/airport-data.lite.min.js');
        const [lhr]: Airport[] = await umdLite.getAirportByIata('LHR');
        expect(lhr.website).toBeUndefined();
        expect(lhr.wikipedia).toBeUndefined();
        const links = await umdLite.getAirportLinks('LHR');
        expect(links.website).toBeUndefined();
    });
});

describe('Nearby airports', () => {
    test('results are sorted by distance and carry a distance in km', async () => {
        const nearby: Array<Airport & { distance: number }> = await lib.findNearbyAirports(51.5074, -0.1278, 60);
        expect(nearby.length).toBeGreaterThan(3);
        for (const airport of nearby) {
            expect(typeof airport.distance).toBe('number');
            expect(Number.isFinite(airport.distance)).toBe(true);
        }
        const distances = nearby.map(a => a.distance);
        expect(distances).toEqual([...distances].sort((a, b) => a - b));
        const lhr = nearby.find(a => a.iata === 'LHR')!;
        expect(lhr.distance).toBeGreaterThan(20);
        expect(lhr.distance).toBeLessThan(30);
    });

    test('the returned airport objects are copies', async () => {
        const first: Array<Airport & { distance: number }> = await lib.findNearbyAirports(51.5074, -0.1278, 30);
        const lhr = first.find(a => a.iata === 'LHR')!;
        lhr.city = 'Mutated';
        const second: Array<Airport> = await lib.findNearbyAirports(51.5074, -0.1278, 30);
        expect(second.find(a => a.iata === 'LHR')!.city).toBe('London');
    });

    test('an optional limit caps the results', async () => {
        const capped: Array<Airport & { distance: number }> = await lib.findNearbyAirports(51.5074, -0.1278, 60, 2);
        expect(capped).toHaveLength(2);
        expect(capped[0].distance).toBeLessThanOrEqual(capped[1].distance);
        await expect(lib.findNearbyAirports(51.5074, -0.1278, 60, 1.5)).rejects.toThrow(/limit/i);
        await expect(lib.findNearbyAirports(51.5074, -0.1278, 60, 0)).rejects.toThrow(/limit/i);
    });
});

describe('Airports by type', () => {
    test('an optional limit caps the results', async () => {
        const all: Airport[] = await lib.getAirportsByType('large_airport');
        expect(all.length).toBeGreaterThan(3);
        expect(await lib.getAirportsByType('large_airport', 3)).toHaveLength(3);
        expect((await lib.getAirportsByType('airport', 5)).length).toBeLessThanOrEqual(5);
        await expect(lib.getAirportsByType('large_airport', 2.5)).rejects.toThrow(/limit/i);
    });
});

describe('Reassigned airport codes', () => {
    test('Alexandria International uses ALY/HEAX and El Nouzha is closed', async () => {
        const [aly]: Airport[] = await lib.getAirportByIata('ALY');
        expect(aly.airport).toBe('Alexandria International Airport');
        expect(aly.icao).toBe('HEAX');
        expect(aly.flightradar24_url).toContain('/ALY');
        await expect(lib.getAirportByIata('HBE')).rejects.toThrow(/No data found/);
        await expect(lib.getAirportByIcao('HEBA')).rejects.toThrow(/No data found/);

        const [nouzha]: Airport[] = await lib.findAirports({ airport: 'El Nouzha Airport' });
        expect(nouzha.type).toBe('closed');
        expect(nouzha.iata).toBe('');
        expect(nouzha.icao).toBe('');
        expect(nouzha.scheduled_service).toBe('FALSE');
        expect(nouzha.flightradar24_url).toBe('');
    });

    test('Manas keeps its new BSZ/FRU-context codes', async () => {
        const [bsz]: Airport[] = await lib.getAirportByIata('BSZ');
        expect(bsz.icao).toBe('UCFM');
        expect(bsz.airport).toBe('Manas International Airport');
        expect(bsz.flightradar24_url).toContain('/BSZ');
        await expect(lib.getAirportByIata('FRU')).rejects.toThrow(/No data found/);
    });
});

describe('Package layout', () => {
    test('the dataset is stored once and shared by the CJS and ESM entries', () => {
        const fs = require('node:fs');
        expect(fs.statSync('lib/payload.full.js').size).toBeGreaterThan(1_000_000);
        expect(fs.statSync('lib/payload.lite.js').size).toBeGreaterThan(400_000);
        expect(fs.statSync('lib/index.js').size).toBeLessThan(200_000);
        expect(fs.statSync('lib/index.mjs').size).toBeLessThan(200_000);
        expect(fs.statSync('lib/lite.js').size).toBeLessThan(200_000);
        expect(fs.statSync('lib/lite.mjs').size).toBeLessThan(200_000);
        expect(fs.readFileSync('lib/index.js', 'utf8')).toContain('payload.full.js');
        expect(fs.readFileSync('lib/index.mjs', 'utf8')).toContain('payload.full.js');
        expect(fs.readFileSync('lib/lite.js', 'utf8')).toContain('payload.lite.js');
        expect(fs.readFileSync('lib/lite.mjs', 'utf8')).toContain('payload.lite.js');
    });
});
