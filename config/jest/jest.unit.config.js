const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..', '..'),
  testEnvironment: 'node',
  testMatch: ['**/test/*.js', '**/test/**/*.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  moduleNameMapper: {
    'formdata-node/lib/cjs/fileFromPath.js':
      '<rootDir>/node_modules/formdata-node/lib/cjs/fileFromPath.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/test/data/',
    '<rootDir>/test/jest.setup.js',
    '<rootDir>/test/specmap/data/',
    '<rootDir>/test/build-artifacts/',
  ],
};
