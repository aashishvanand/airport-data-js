const path = require('path');

module.exports = {
  entry: './.tsbuild/index.js',
  target: 'node',
  mode: 'production',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'lib'),
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};
