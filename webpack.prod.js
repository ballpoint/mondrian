const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const path = require('path');

var gitRev = process.env.GIT_REV;

if (gitRev === '') {
  console.log('Missing GIT_REV');
  process.exit(1);
}

module.exports = merge(common, {
  plugins: [new UglifyJSPlugin()],

  output: {
    path: path.join(__dirname, 'build/prod'),
    filename: '[name].' + gitRev + '.bundle.js'
  }
});
