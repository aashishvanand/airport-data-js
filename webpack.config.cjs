const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'airportData',
    libraryTarget: 'umd',
    globalObject: 'this'   // Ensure compatibility with both Node and Browser
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.gz$/,
        use: 'file-loader',
        type: 'javascript/auto'  // This is essential to handle the binary format
    }
    ]
  },
  mode: 'production'
};
