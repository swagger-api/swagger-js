import path from 'path'
import buildConfig from './_config-builder'

export default buildConfig({
  minimize: false,
  mangle: false,
  sourcemaps: true,
  includeDependencies: false,
}, {})
