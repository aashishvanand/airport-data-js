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
  resolve: {
    extensions: ['.js', '.json']
  }
};
