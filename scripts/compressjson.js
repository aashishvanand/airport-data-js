const jsonpack = require('jsonpack');
const fs = require('fs-extra');

async function compressJSON() {
  // Read the original JSON data
  const originalData = await fs.readJson('airports.json');

  // Compress the data using jsonpack
  const packedData = jsonpack.pack(originalData);

  // Write the compressed data to a new file
  await fs.writeFile('airports.compressed', packedData, 'utf8');

  console.log('Compression complete. Compressed data written to airports.compressed');
}

compressJSON().catch(err => {
  console.error('Error during compression:', err);
});
