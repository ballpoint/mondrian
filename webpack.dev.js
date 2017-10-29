const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
    new ExtractTextPlugin('[name].css')
  ],

  output: {
    path: path.join(__dirname, 'build/dev'),
    filename: '[name].js'
  }
});
