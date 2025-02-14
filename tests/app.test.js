// Test timeouts in seconds
const TIMEOUTS = {
  JEST: 10,
  PAGE: 1,
  NAVIGATION: 1,
  SELECTOR: 3
};

// Convert seconds to milliseconds
const toMs = seconds => seconds * 1000;

describe('Weather App', () => {
  jest.setTimeout(toMs(TIMEOUTS.JEST));

  beforeAll(async () => {
    try {
      // Mock service worker and notification APIs
      await page.evaluateOnNewDocument(() => {
        window.navigator.serviceWorker = {
          controller: null,
          ready: Promise.resolve({ periodicSync: { register: () => Promise.resolve() } })
        };
      });

      await page.setDefaultTimeout(toMs(TIMEOUTS.PAGE));
      await page.setDefaultNavigationTimeout(toMs(TIMEOUTS.NAVIGATION));
      
      const response = await page.goto('http://localhost:3000', {
        waitUntil: 'domcontentloaded',
        timeout: toMs(TIMEOUTS.PAGE)
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
      await page.waitForSelector(imageSelector, { timeout: toMs(TIMEOUTS.SELECTOR) });

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

  test('satellite image works offline', async () => {
    try {
      // Wait for the first image on the page (satellite image)
      console.log('Waiting for image selector...');
      const imageSelector = 'img[src*="weatherSat_si_pda.png"]';
      await page.waitForSelector(imageSelector, { timeout: toMs(TIMEOUTS.SELECTOR) });

      // Check initial image load
      console.log('Checking initial image load...');
      let imageLoaded = await page.evaluate(sel => {
        const img = document.querySelector(sel);
        return img.complete && img.naturalHeight !== 0;
      }, imageSelector);
      expect(imageLoaded).toBe(true);

      // Go offline
      console.log('Setting offline mode...');
      await page.setOfflineMode(true);

      // Refresh page
      console.log('Refreshing page in offline mode...');
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Wait for image to load from cache
      await page.waitForSelector(imageSelector, { timeout: toMs(TIMEOUTS.SELECTOR) });

      // Verify image still loads from cache
      console.log('Checking cached image load...');
      imageLoaded = await page.evaluate(sel => {
        const img = document.querySelector(sel);
        return img.complete && img.naturalHeight !== 0;
      }, imageSelector);
      expect(imageLoaded).toBe(true);

      // Verify image visibility
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
    } finally {
      // Cleanup - go back online
      await page.setOfflineMode(false);
    }
  });
});
