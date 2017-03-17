const deepMerge = require('deepmerge')
const webpackConfig = require('./webpack.common.js')

module.exports = deepMerge(
  webpackConfig, {
    externals: function trueIfThirdPartyLib(context, req, next) {
      next(null, req[0] !== '.')
    }
  }
)
