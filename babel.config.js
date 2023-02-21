/**
 * This is override for https://github.com/lodash/babel-plugin-lodash/issues/259.
 * babel-plugin-lodash is using deprecated babel API, which causes generation of many
 * console.trace calls.
 */

const consoleTrace = console.trace.bind(console);
console.trace = (message, ...optionalParams) => {
  if (
    typeof message === 'string' &&
    message.startsWith('`isModuleDeclaration` has been deprecated')
  ) {
    return undefined; // noop
  }

  return consoleTrace(message, ...optionalParams);
};

module.exports = {
  env: {
    commonjs: {
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: 'commonjs',
            corejs: { version: 3 },
            useBuiltIns: false,
            targets: {
              node: '12.20.0',
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
            corejs: { version: 3 },
            useBuiltIns: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            absoluteRuntime: false,
            corejs: 3,
            version: '^7.11.2',
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
            corejs: { version: 3 },
            useBuiltIns: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 3,
            version: '^7.11.2',
          },
        ],
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
        'lodash',
      ],
    },
  },
};
