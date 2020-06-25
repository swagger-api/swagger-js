import buildConfig from './_config-builder';

export default buildConfig(
  {
    minimize: false,
    mangle: false,
    sourcemaps: false,
    includeDependencies: false,
    umd: false,
  },
  {}
);
