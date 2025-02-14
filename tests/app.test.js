describe('Weather App', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    try {
      // Mock service worker and notification APIs
      await page.evaluateOnNewDocument(() => {
        window.navigator.serviceWorker = {
          controller: null,
          ready: Promise.resolve({ periodicSync: { register: () => Promise.resolve() } })
        };
      });

      await page.setDefaultTimeout(15000);
      await page.setDefaultNavigationTimeout(15000);
      
      const response = await page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      expect(response.status()).toBe(200);
    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
    }
  });

  test('satellite image loads correctly', async () => {
    try {
      // Wait for the first image on the page (satellite image)
      console.log('Waiting for image selector...');
      const imageSelector = 'img[src*="weatherSat_si_pda.png"]';
      await page.waitForSelector(imageSelector, { timeout: 15000 });

      // Get the image element and verify it exists
      console.log('Getting image element...');
      const image = await page.$(imageSelector);
      expect(image).toBeTruthy();

      // Log the image properties
      console.log('Checking image properties...');
      const imageSrc = await page.evaluate(sel => {
        const img = document.querySelector(sel);
        return {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        };
      }, imageSelector);
      console.log('Image properties:', imageSrc);

      // Check if image loaded successfully
      const imageLoaded = await page.evaluate(sel => {
        const img = document.querySelector(sel);
        return img.complete && img.naturalHeight !== 0;
      }, imageSelector);
      expect(imageLoaded).toBe(true);

      // Check image visibility
      const isVisible = await page.evaluate(sel => {
        const img = document.querySelector(sel);
        const style = window.getComputedStyle(img);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && img.offsetParent !== null;
      }, imageSelector);
      expect(isVisible).toBe(true);

      console.log('Test completed successfully');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});
