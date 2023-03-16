/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = (env, argv) => ({
  devtool: argv.mode === 'development' ? 'inline-source-map' : undefined,
  entry: {
    background: './src/background.index.ts',
    content: './src/content.index.ts',
    devtools: './src/devtools.index.ts',
    popup: './src/popup.index.tsx',
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: './static', to: './' }],
    }),
    new NodePolyfillPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
});
