module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.e2e.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest'
  },
  verbose: true
};
