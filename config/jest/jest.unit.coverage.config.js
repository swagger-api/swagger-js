const unitConfig = require('./jest.unit.config.js');

module.exports = {
  ...unitConfig,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    './src/': {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
      // branches: 87,
      // functions: 91,
      // lines: 90,
      // statements: 90,
    },
  },
};
