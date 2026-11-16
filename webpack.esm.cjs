const path = require('path');

// ES module builds for `import` consumers (Node ESM, Vite, Next.js, Deno, bundlers).
module.exports = {
  entry: {
    index: './.tsbuild-esm/index.js',
    lite: './.tsbuild-esm/lite.js',
    tools: './.tsbuild-esm/tools.js'
  },
  target: ['web', 'es2020'],
  mode: 'production',
  experiments: {
    outputModule: true
  },
  output: {
    filename: '[name].mjs',
    path: path.resolve(__dirname, 'lib'),
    library: { type: 'module' },
    module: true,
    chunkFormat: 'module'
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false
  },
  module: {
    rules: [
      // package.json is "type": "commonjs", so mark the tsc ESM output as ES modules explicitly.
      { test: /\.js$/, include: path.resolve(__dirname, '.tsbuild-esm'), type: 'javascript/esm' },
      // pako ships ESM under a CJS package; let webpack detect the format.
      { test: /\.m?js$/, include: /node_modules/, type: 'javascript/auto', resolve: { fullySpecified: false } }
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};
