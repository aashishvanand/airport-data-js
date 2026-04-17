const path = require('path');

module.exports = {
    target: 'web',
    entry: './src/index.ts',
    mode: 'production',
    output: {
        filename: 'airport-data.min.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'AirportData',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: 'this'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
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
                test: /\.compressed$/,
                type: 'asset/source',
            }
        ]
    },
    resolve: {
        fallback: {
            "fs": false,
            "path": require.resolve("path-browserify")
         },
        extensions: ['.ts', '.js', '.json']
    }
};
