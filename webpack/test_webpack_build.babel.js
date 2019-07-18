// Used in `test:unit:setup`

import path from 'path'
import buildConfig from './_config-builder'

export default buildConfig({
  minimize: true, // TODO: turn off?
  mangle: true, // TODO: turn off?
  sourcemaps: true,
  includeDependencies: false,
}, {
  output: {
    path: path.join(__dirname, '../test/webpack-bundle/.tmp'),
    libraryTarget: 'umd',
    filename: 'swagger-client.js',
  }
})
