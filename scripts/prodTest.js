const { getAirportByIata, getAirportByIcao, getAirportByCityCode, getAirportByCountryCode } = require('../src/index.js');


async function testProductionData() {
    try {
        console.log(await getAirportByIata('AAA'));
        console.log(await getAirportByIcao('NTGA'));
        console.log(await getAirportByCityCode('AAA'));
        console.log(await getAirportByCountryCode('PF'));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testProductionData();
