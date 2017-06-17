const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.join(__dirname, 'src/script'),

  output: {
    path: path.join(__dirname, 'build')
  },

  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.join(__dirname, 'src/script'),
      path.join(__dirname, 'src/svg'),
      path.join(__dirname, 'src/styles')
    ],
    extensions: ['.js', '.svg', '.scss']
  },

  entry: {
    'bundles/app':    'main.js',
    'bundles/vendor': 'vendor.js',
    'bundles/test':   'test.js'
  },

  output: {
    path: path.join(__dirname, './build'),
    filename: '[name].bundle.js',
  },

  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
    new ExtractTextPlugin('styles.css')
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [['react']]
        }
      },
      {
        test: /test.js$/,
        use: 'mocha-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        loader: 'raw-loader'
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ['css-loader', 'sass-loader']
        })
      }
    ],
  }
};
