const path = require('path')
const deepMerge = require('deepmerge')
const webpackConfig = require('./webpack.common.js')

module.exports = deepMerge(
  webpackConfig, {
    externals: (ctx, req, next) => {
      next(null, false)
    },

    output: {
      path: path.join(__dirname, 'browser'),
      library: 'SwaggerClient',
      libraryTarget: 'umd',
      filename: 'swagger-client.js'
    },

  }
)
