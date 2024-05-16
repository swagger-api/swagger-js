const path = require('node:path');

module.exports = {
  env: {
    jest: true,
  },
  globals: {
    fetch: true,
    Response: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    babelOptions: { configFile: path.join(__dirname, '..', 'babel.config.js') },
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      impliedStrict: true,
    },
  },
  rules: {
    'global-require': 0, // needs to be eliminated in future
    'import/no-dynamic-require': 0,
    'max-classes-per-file': 0,
    'no-underscore-dangle': 0,
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
