module.exports = {
  launch: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-features=GlobalMediaControls',
      '--disable-notifications',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-extensions',
      '--disable-features=TranslateUI,BlinkGenPropertyTrees',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-chrome-google-urls',
      '--disable-sync',
      '--disable-cloud-import',
      '--disable-google-safesearch',
      '--disable-gaia-services',
      '--disable-features=DialMediaRouteProvider',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-features=OptimizationHints',
      '--disable-fine-grained-time-zone-detection',
      '--disable-glsl-translator',
      '--disable-hang-monitor',
      '--disable-machine-cert-request',
      '--disable-zero-suggest',
      '--disable-webgl',
      '--enable-logging',
      '--force-fieldtrials=*BackgroundTracing/default/',
      '--log-level=3',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-pings'
    ],
    dumpio: true,
    ignoreDefaultArgs: ['--enable-automation'],
    env: {
      LANGUAGE: 'en-US',
      TZ: 'UTC'
    }
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
