const path = require('path');

module.exports = {
  entry: './.tsbuild/tools.js',
  target: 'node',
  mode: 'production',
  output: {
    filename: 'tools.js',
    path: path.resolve(__dirname, 'lib'),
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};
