const { setup: setupDevServer } = require('jest-dev-server');
const { mkdir } = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3001;

module.exports = async function globalSetup() {
  await mkdir(path.join(__dirname, '../../screenshots'), { recursive: true });
  
  await setupDevServer({
    command: `npx http-server ./src -p ${PORT} --cors -c-1`,
    launchTimeout: 50000,
    port: PORT,
    usedPortAction: 'error'
  });

  // Add custom matchers
  expect.extend({
    async toBeAccessible(page) {
      try {
        await page.waitForSelector('body', { timeout: 5000 });
        return {
          message: () => 'expected page to be accessible',
          pass: true
        };
      } catch (error) {
        return {
          message: () => `expected page to be accessible but got error: ${error.message}`,
          pass: false
        };
      }
    }
  });
};
