const path = require('path');

module.exports = {
  target: 'node', // Target node environment
  entry: './index.js', // Your library entry point
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'index.js', // Output file name
    libraryTarget: 'commonjs2' // This is important to make the library usable in Node.js
  },
  mode: 'production', // Use 'development' for better debug info
  module: {
    rules: [
      // Add loaders for transpiling (like Babel) or handling other file types if needed
    ]
  },
  externals: {
    // This will exclude node_modules from being bundled, it'll use the installed versions
    // Add any other external libraries if needed
    'fs': 'commonjs fs',
    'zlib': 'commonjs zlib'
  }
};
