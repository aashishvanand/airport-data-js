const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  target: 'node',
  performance: {
    hints: false
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  output: {
    filename: 'airports.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'airports',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.bin$/,
        use: {
          loader: 'arraybuffer-loader',
        }
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './src/*.bin', to: '[name][ext]' }
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false // this tells Webpack to provide an empty module when fs is imported
    }
  },
  externals: {
    pako: 'pako'
  }
};
