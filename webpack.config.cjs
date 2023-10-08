const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    return {
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
            new webpack.IgnorePlugin({ resourceRegExp: /^(fs|path)$/ }) // Added this line
        ],
        resolve: {
            extensions: ['.js'],
            fallback: {
                "path": require.resolve("path-browserify"),
                // Only provide an empty module for 'fs' when not targeting Node.js
                "fs": (argv.target === 'node') ? undefined : false 
            }
        },
        externals: {
            pako: 'pako'
        }
    };
};
