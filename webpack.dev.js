const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const path = require('path');
const WebpackAssetsManifest = require('webpack-assets-manifest');

module.exports = merge(common, {
  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
    new WebpackAssetsManifest({
      output: path.join(__dirname, 'build/dev/manifest.json')
    }),
    new ExtractTextPlugin('[name].css')
  ],

  output: {
    path: path.join(__dirname, 'build/dev'),
    filename: '[name].js'
  },

  entry: {
    test: 'test.js',
    testbool: 'testbool.js'
  }
});
