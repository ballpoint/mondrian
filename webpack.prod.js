const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const path = require('path');
const WebpackSHAHash = require('webpack-sha-hash');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = merge(common, {
  plugins: [
    new WebpackSHAHash(),
    new WebpackAssetsManifest({
      output: path.join(__dirname, 'build/prod/manifest.json')
    }),
    new ExtractTextPlugin('[name].[chunkhash].css'),
    new UglifyJSPlugin()
  ],

  output: {
    path: path.join(__dirname, 'build/prod'),
    filename: '[name].[chunkhash].bundle.js'
  }
});
