module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/*.js?(x)', '**/test/**/*.js?(x)'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/test/data/',
    '<rootDir>/test/jest.setup.js',
    '<rootDir>/test/specmap/data/',
    '<rootDir>/test/webpack-bundle/',
  ],
};
