const unitConfig = require('./jest.unit.config.js');

module.exports = {
  ...unitConfig,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    './src/': {
      branches: 83,
      functions: 91,
      lines: 88,
      statements: 88,
    },
  },
};
