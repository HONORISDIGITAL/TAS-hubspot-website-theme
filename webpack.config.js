const path = require('path');
const glob = require('glob');
const TerserPlugin = require('terser-webpack-plugin');

const moduleFiles = glob.sync('./src/modules/*.module/module.js');
const modulesEntries = moduleFiles.reduce((entries, moduleFile) => {
    const modulePath = path.parse(moduleFile);
    const entryKey = modulePath.dir.split('/').pop();
    entries[entryKey] = './' + moduleFile;
    return entries;
}, {});

const entries = {
    main: glob.sync(['./src/js/*.js', './src/js/**/*.js']),
    ...modulesEntries
};

module.exports = {
    mode: 'production',
    entry: entries,
    output: {
        filename: (chunkData) => {
            if(chunkData.chunk.name === 'dependencies') {
                return chunkData.chunk.name + '.js';
            }
            if(chunkData.chunk.name === 'main') {
                return 'main.js';
            }
            return '../modules/[name]/module.js';
        },
        path: path.resolve(__dirname, './dist'),
        chunkFilename: 'dependencies.js',
    },
    resolve: {
        alias: {
            'dist': path.resolve(__dirname, 'dist'),
            'src/js/_utils': path.resolve(__dirname, 'src/js/_utils'),
            'src/js': path.resolve(__dirname, 'src/js'),
            'src/modules': path.resolve(__dirname, 'src/modules'),
        },
        extensions: ['.js'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src/js'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src/modules'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            extractComments: false,
        })],
        splitChunks: {
            cacheGroups: {
                dependencies: {
                    test: /[\\/]node_modules[\\/]/,
                    name: () => 'dependencies',
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
    },
};