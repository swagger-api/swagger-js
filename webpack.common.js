const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    'swagger-client': [
      './src/index.js'
    ]
  },

  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
    filename: 'index.js'
  },

  module: {
    loaders: [{
      test: /\.js/,
      loader: 'babel-loader',
      exclude: [
        /node_modules/
      ]
    }]
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json']
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ]
}
