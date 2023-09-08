module.exports = {
  env: {
    commonjs: {
      browserslistEnv: 'isomorphic-production',
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: 'commonjs',
            loose: true,
            useBuiltIns: false,
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: { version: 3, proposals: false },
            absoluteRuntime: false,
            helpers: true,
            regenerator: false,
            version: '^7.22.15',
          },
        ],
      ],
    },
    es: {
      browserslistEnv: 'isomorphic-production',
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: false,
            useBuiltIns: false,
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: { version: 3, proposals: false },
            absoluteRuntime: false,
            helpers: true,
            regenerator: false,
            useESModules: true,
            version: '^7.22.15',
          },
        ],
      ],
    },
    browser: {
      browserslistEnv: 'browser-production',
      sourceType: 'unambiguous', // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: 'auto',
            useBuiltIns: false,
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: { version: 3, proposals: false },
            absoluteRuntime: false,
            helpers: true,
            regenerator: false,
            version: '^7.22.15',
          },
        ],
      ],
    },
  },
};
