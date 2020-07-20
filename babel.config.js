module.exports = {
  env: {
    commonjs: {
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: 'commonjs',
            targets: {
              node: '8',
            },
            forceAllTransforms: false,
            ignoreBrowserslistConfig: true,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-modules-commonjs',
          {
            loose: true,
          },
        ],
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
      ],
    },
    es: {
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            absoluteRuntime: false,
            corejs: 2,
            version: '^7.10.4',
          },
        ],
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
        'lodash',
      ],
    },
    browser: {
      sourceType: 'unambiguous', // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 2,
            version: '^7.10.4',
          },
        ],
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
        'lodash',
      ],
    },
  },
};
