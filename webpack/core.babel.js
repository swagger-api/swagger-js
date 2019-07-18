import path from 'path'
import buildConfig from './_config-builder'

export default buildConfig({
  minimize: true, // TODO: turn off?
  mangle: true, // TODO: turn off?
  sourcemaps: true,
  includeDependencies: false,
}, {})
