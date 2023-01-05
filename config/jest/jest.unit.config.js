const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..', '..'),
  testEnvironment: 'node',
  testMatch: ['**/test/*.js', '**/test/**/*.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  moduleNameMapper: {
    'formdata-node/lib/cjs/fileFromPath.js':
      '<rootDir>/node_modules/formdata-node/lib/cjs/fileFromPath.js',
    /**
     * This is here only until next version of Jest is released - 29.4.x.
     * Jest doesn't support package.json imports fields now, so we have
     * to provide this workaround.
     *
     * More information in https://github.com/facebook/jest/issues/12270.
     *
     */
    '#buffer':
      '<rootDir>/node_modules/@swagger-api/apidom-reference/cjs/util/polyfills/buffer/protocol-import.cjs',
    '#fs':
      '<rootDir>/node_modules/@swagger-api/apidom-reference/cjs/util/polyfills/fs/protocol-import.cjs',
    '#util':
      '<rootDir>/node_modules/@swagger-api/apidom-reference/cjs/util/polyfills/util/protocol-import.cjs',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/test/data/',
    '<rootDir>/test/jest.setup.js',
    '<rootDir>/test/specmap/data/',
    '<rootDir>/test/build-artifacts/',
    '/__fixtures__/',
    '/__utils__/',
  ],
};
