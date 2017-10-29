const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: path.join(__dirname, 'src'),

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
    vendor: 'vendor.js',
    views: 'views.js',
    app: 'app.js'
  },

  plugins: [],

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
