const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..', '..'),
  testEnvironment: 'node',
  testMatch: ['**/test/*.js', '**/test/**/*.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
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
