const PORT = process.env.PORT || 3001;

module.exports = {
  launch: {
    dumpio: true,
    headless: "new",
    args: [
      '--disable-infobars',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  },
  browserContext: 'default',
  server: {
    command: `npx serve ./src -p ${PORT}`,
    port: PORT,
    launchTimeout: 30000,
    debug: true,
  },
};
