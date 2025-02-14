module.exports = {
  launch: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    dumpio: true
  },
  server: {
    command: 'npx serve -p 3000',
    port: 3000,
    launchTimeout: 30000,
    debug: true,
    usedPortAction: 'kill'
  },
  browserContext: 'default'
}
