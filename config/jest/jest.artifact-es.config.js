const path = require('path');

module.exports = {
  rootDir: path.join(__dirname, '..', '..'),
  testEnvironment: 'node',
  testMatch: ['**/test/build-artifacts/es.js'],
};
