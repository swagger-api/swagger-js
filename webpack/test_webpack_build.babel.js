// Used in `test:unit:setup`

import path from 'path'
import buildConfig from './_config-builder'

export default buildConfig({
  minimize: false,
  mangle: false,
  sourcemaps: false,
  includeDependencies: false,
  umd: true,
}, {
  output: {
    path: path.join(__dirname, '../test/webpack-bundle/.tmp'),
    filename: 'swagger-client.js',
  }
})
