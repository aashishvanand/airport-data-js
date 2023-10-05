const airportData = require('../dist/index');

describe('airportData library', () => {
    
    it('should retrieve airport data by IATA code', () => {
        const result = airportData.getAirportByIata("AAA");
        expect(result).toBeTruthy();
        expect(result[0].iata).toBe("AAA");
    });

    it('should retrieve airport data by ICAO code', () => {
        const result = airportData.getAirportByIcao("NTGA");
        expect(result).toBeTruthy();
        expect(result[0].icao).toBe("NTGA");
    });

    it('should retrieve airport data by city code', () => {
        const result = airportData.getAirportByCityCode("AAA");
        expect(result).toBeTruthy();
        expect(result[0].city_code).toBe("AAA");
    });

    it('should retrieve airport data by country code', () => {
        const result = airportData.getAirportByCountryCode("PF");
        expect(result).toBeTruthy();
        expect(result[0].country_code).toBe("PF");
    });

    it('should throw error for invalid IATA format', () => {
        expect(() => airportData.getAirportByIata("AA")).toThrow("Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'.");
    });

});

