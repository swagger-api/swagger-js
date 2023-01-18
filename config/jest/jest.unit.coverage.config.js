const unitConfig = require('./jest.unit.config.js');

module.exports = {
  ...unitConfig,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    './src/': {
      branches: 86,
      functions: 91,
      lines: 90,
      statements: 89,
    },
  },
};
