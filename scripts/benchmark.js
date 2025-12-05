/**
 * Benchmarks the library performance.
 * Measures:
 * 1. First access time (lazy loading / initialization).
 * 2. Search performance (indexed lookups).
 * 3. Memory usage.
 * Usage: node scripts/benchmark.js
 */

const { getAirportByIata } = require('../dist/airport-data.min.js');

console.log('--- Starting Benchmark ---');

try {
    // 1. Measure First Access (Lazy Loading + Unpacking + Indexing)
    console.time('First Access (Lazy Load + Index)');
    // This should trigger unpacking and building the IATA index
    getAirportByIata('LHR').then(() => {
        console.timeEnd('First Access (Lazy Load + Index)');

        // 2. Measure Search Performance (Indexed Search)
        const searchCount = 1000;
        const searchCodes = ['AAA', 'JFK', 'LHR', 'DXB', 'SIN', 'HND', 'SYD', 'CPT', 'GRU', 'YYZ'];

        console.time(`Indexed Search (${searchCount} iterations)`);
        const promises = [];
        for (let i = 0; i < searchCount; i++) {
            const code = searchCodes[i % searchCodes.length];
            promises.push(getAirportByIata(code));
        }

        Promise.all(promises).then(() => {
            console.timeEnd(`Indexed Search (${searchCount} iterations)`);

            // 3. Measure Memory Usage
            const used = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`Memory Usage: ${Math.round(used * 100) / 100} MB`);
        });
    });

} catch (error) {
    console.error('Benchmark failed:', error);
}
