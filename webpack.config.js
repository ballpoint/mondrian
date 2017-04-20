const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.join(__dirname, 'src/script'),

  output: {
    path: path.join(__dirname, 'build')
  },

  plugins: [
    new webpack.SourceMapDevToolPlugin({})
  ],

  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.join(__dirname, 'src/script'),
      path.join(__dirname, 'src/svg')
    ],
    extensions: ['.js', '.svg']
  },

  entry: {
    'bundles/app': 'main.js',
  },

  output: {
    path: path.join(__dirname, './build'),
    filename: '[name].bundle.js',
  },

  module: {
    rules: [
      {
        test: /\.svg$/,
        loader: 'raw-loader'
      }
    ],
  }
};
