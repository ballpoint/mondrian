const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.join(__dirname, 'src/script'),

  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.join(__dirname, 'src/script'),
      path.join(__dirname, 'src/svg'),
      path.join(__dirname, 'src/styles'),
      path.join(__dirname, 'src/proto')
    ],
    extensions: ['.js', '.svg', '.scss', '.proto']
  },

  entry: {
    'bundles/vendor': 'vendor.js',
    'bundles/views': 'views.js',
    'bundles/app': 'app.js',
    'bundles/test': 'test.js',
    'bundles/testbool': 'testbool.js'
  },

  output: {
    path: path.join(__dirname, './build'),
    filename: '[name].bundle.js'
  },

  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
    new ExtractTextPlugin('styles/[name].css')
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
      {
        test: /test.js$/,
        use: 'mocha-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svg$/,
        loader: 'raw-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      }
    ]
  }
};
