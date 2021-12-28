/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');

/**
 * @type import("webpack").Configuration
 */
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'inline-source-map',
  cache: true,
  watchOptions: {
    ignored: ['**/node_modules'],
  },
  entry: {
    content: `${__dirname}/src/content/content.ts`,
    background: `${__dirname}/src/background/background.ts`,
    // 'devtools': `${__dirname}/src/devtools/devtools.ts`,
    options: `${__dirname}/src/options/options.ts`,
    popup: `${__dirname}/src/popup/popup.ts`,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: './public',
          to: './',
        },
      ],
    }),
  ],
};
