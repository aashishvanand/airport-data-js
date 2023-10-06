const fs = require('fs');
const pako = require('pako');

const CHUNK_SIZE = 500;  // Number of records per chunk
const INPUT_JSON_PATH = './data/airports.json';  // Adjust to your path
const OUTPUT_DIR = './src';

// Read the JSON data
const jsonData = JSON.parse(fs.readFileSync(INPUT_JSON_PATH, 'utf-8'));

// Create chunks directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Split the JSON data into chunks and compress each chunk
for (let i = 0, j = jsonData.length; i < j; i += CHUNK_SIZE) {
    const chunk = jsonData.slice(i, i + CHUNK_SIZE);
    const compressedData = pako.deflate(JSON.stringify(chunk));

    // Save the compressed chunk as a .bin file
    fs.writeFileSync(`${OUTPUT_DIR}/airports_chunk_${i / CHUNK_SIZE}.bin`, compressedData);
}

console.log('Chunk files generated successfully.');
