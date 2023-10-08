const { getAirportByIata, getAirportByIcao, getAirportByCityCode, getAirportByCountryCode } = require('../dist/airport-data.min.js');

    describe('airportData library', () => {
        test('should retrieve airport data by IATA code', async () => {
            const data = await getAirportByIata('AAA');
            expect(data[0].iata).toEqual('AAA');
    });
  
      test('should retrieve airport data by ICAO code', async () => {
          const data = await getAirportByIcao('NTGA');
          expect(data[0].icao).toEqual('NTGA');
      });
  
      test('should retrieve airport data by city code', async () => {
          const data = await getAirportByCityCode('AAA');
          expect(data[0].city_code).toEqual('AAA');
      });
  
      test('should retrieve airport data by country code', async () => {
          const data = await getAirportByCountryCode('IN');
          expect(data[0].country_code).toEqual('IN');
      });
  
      test('should throw error for invalid IATA format', async () => {
          await expect(getAirportByIata('AAAA')).rejects.toThrow("Invalid IATA format. Please provide a 3-letter uppercase code, e.g., 'AAA'.");
      });
  });
  
  