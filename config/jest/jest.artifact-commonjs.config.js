const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..', '..'),
  testEnvironment: 'node',
  testMatch: ['**/test/build-artifacts/commonjs.js'],
  moduleNameMapper: {
    /**
     * This is here only until next version of Jest is released - 29.4.x.
     * Jest doesn't support package.json imports fields now, so we have
     * to provide this workaround.
     *
     * More information in https://github.com/facebook/jest/issues/12270.
     *
     */
  },
};
