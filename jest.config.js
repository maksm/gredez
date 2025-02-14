module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['expect-puppeteer'],
  testTimeout: 30000
}
