import path from 'path';

import buildConfig from './_config-builder';

export default buildConfig(
  {
    minimize: true,
    mangle: true,
    sourcemaps: true,
    includeDependencies: true,
    umd: true,
  },
  {
    output: {
      path: path.join(__dirname, '..', '..', 'browser'),
    },
  }
);
