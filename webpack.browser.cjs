const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'airports.bundle.js',
    library: 'airports',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
            },
          },
          {
            test: /\.bin$/,
            type: 'asset/resource',
          },
    ],
  },
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      fs: false
    }
  },
  
  target: 'web',
};
