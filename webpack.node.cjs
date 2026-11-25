const path = require('path');

module.exports = {
  entry: {
    index: './.tsbuild/index.js',
    lite: './.tsbuild/lite.js'
  },
  target: 'node',
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'lib'),
    libraryTarget: 'commonjs2'
  },
  // The dataset is written once to lib/payload.*.js by scripts/build_payload.ts.
  externals: {
    './airports.data.json': 'commonjs ./payload.full.js',
    './airports.lite.data.json': 'commonjs ./payload.lite.js'
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};
