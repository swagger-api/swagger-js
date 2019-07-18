import path from 'path'
import buildConfig from './_config-builder'

const DEPS_CHECK_DIR = require('../package.json').config.deps_check_dir

export default buildConfig({
  minimize: true,
  mangle: true,
  sourcemaps: true,
  includeDependencies: true,
  umd: false,
}, {
  output: {
    path: path.join(__dirname, '..', DEPS_CHECK_DIR)
  }
})
