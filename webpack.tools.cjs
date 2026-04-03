const path = require('path');

module.exports = {
  entry: './src/tools.ts',
  target: 'node',
  mode: 'production',
  output: {
    filename: 'tools.js',
    path: path.resolve(__dirname, 'lib'),
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
        {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: 'ts-loader',
        },
    ]
  }
};
