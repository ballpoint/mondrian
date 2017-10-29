const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  plugins: [new UglifyJSPlugin()],

  output: {
    path: path.join(__dirname, './prod'),
    filename: '[name].bundle.js'
  }
});
