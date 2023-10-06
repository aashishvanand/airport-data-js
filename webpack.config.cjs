const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'airports.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'airports',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.bin$/,
        use: {
          loader: 'arraybuffer-loader',
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    // Add the following lines:
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false // this tells Webpack to provide an empty module when fs is imported
    }
  },
  externals: {
    pako: 'pako'
  }
};
