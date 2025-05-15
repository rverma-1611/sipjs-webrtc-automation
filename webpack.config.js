// Updated version of webpack.config.js
const path = require('path');

module.exports = {
    entry: './client.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'development',
    target: 'web',
    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
        fullySpecified: false // Important to support CommonJS modules in ESM mode
    },
    experiments: {
        outputModule: true, // To support modern JavaScript modules if needed
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false
                }
            }
        ]
    }
};

