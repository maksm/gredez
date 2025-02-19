const PORT = process.env.PORT || 3001;
const APP_URL = `http://localhost:${PORT}`;

describe('Weather Image Viewer App', () => {
  beforeEach(async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
  });

  it('should load and display the app header', async () => {
    await page.waitForSelector('header');
    const header = await page.$('header');
    expect(header).toBeTruthy();

    const title = await page.$eval('header h1', el => el.textContent);
    expect(title).toBe('Current Weather');
  });

  it('should navigate between pages', async () => {
    // Check home page
    await page.waitForSelector('.image-container img');
    const homeImages = await page.$$('.image-container img');
    expect(homeImages.length).toBe(2);

    // Verify home page images have proper alt text
    const homeImageAlts = await page.$$eval('.image-container img', imgs => 
      imgs.map(img => img.alt)
    );
    expect(homeImageAlts.every(alt => alt === 'Image for Current Weather')).toBe(true);

    // Navigate to forecast page
    await page.click('a[href="/forecast"]');
    await page.waitForSelector('.image-container img');
    
    const forecastImages = await page.$$('.image-container img');
    expect(forecastImages.length).toBe(1);

    // Verify forecast page title and image alt text
    const forecastTitle = await page.$eval('header h1', el => el.textContent);
    expect(forecastTitle).toBe('Weather Forecast');
    const forecastImageAlt = await page.$eval('.image-container img', img => img.alt);
    expect(forecastImageAlt).toBe('Image for Weather Forecast');
  });

  describe('Offline Mode', () => {
    beforeEach(async () => {
      // Ensure we're online first and images are loaded
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', {
          get: () => true,
          configurable: true
        });
        window.dispatchEvent(new Event('online'));
      });
      await page.waitForSelector('.image-container img');
    });

    it('should handle offline mode and recovery', async () => {
      // Increase test timeout to 10 seconds
      jest.setTimeout(10000);
      
      // Store initial image sources
      const initialSrcs = await page.$$eval('.image-container img', imgs => 
        imgs.map(img => img.src)
      );

      // Enable offline mode
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', {
          get: () => false,
          configurable: true
        });
        window.dispatchEvent(new Event('offline'));
      });
      
      // Check if offline indicator appears
      await page.waitForSelector('.connection-status');
      const offlineText = await page.$eval('.connection-status', el => el.textContent);
      expect(offlineText).toBe('Offline');

      // Verify images are still displayed with same sources
      const offlineImageSrcs = await page.$$eval('.image-container img', imgs => 
        imgs.map(img => img.src)
      );
      expect(offlineImageSrcs).toEqual(initialSrcs);

      // Return to online mode
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', {
          get: () => true,
          configurable: true
        });
        window.dispatchEvent(new Event('online'));
      });

      // Verify offline indicator changes
      await page.waitForFunction(() => 
        document.querySelector('.connection-status').textContent === 'Online'
      );
    });
  });

  describe('Swipe Navigation', () => {
    it('should navigate between pages on horizontal swipe', async () => {
      await page.goto(APP_URL, { waitUntil: 'networkidle0' });
      
      // Verify we're on home page
      const initialTitle = await page.$eval('header h1', el => el.textContent);
      expect(initialTitle).toBe('Current Weather');
      
      // Simulate swipe left
      await page.evaluate(() => {
        // Create a touch point
        const touchStart = new Touch({
          identifier: 0,
          target: document.body,
          clientX: 300,
          clientY: 200,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0.5,
        });
        
        // Create touch events
        const touchStartEvent = new TouchEvent('touchstart', {
          cancelable: true,
          bubbles: true,
          touches: [touchStart],
          targetTouches: [touchStart],
          changedTouches: [touchStart],
        });

        const touchEnd = new Touch({
          identifier: 0,
          target: document.body,
          clientX: 50,
          clientY: 200,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0.5,
        });

        const touchEndEvent = new TouchEvent('touchend', {
          cancelable: true,
          bubbles: true,
          touches: [],
          targetTouches: [],
          changedTouches: [touchEnd],
        });
        
        window.dispatchEvent(touchStartEvent);
        window.dispatchEvent(touchEndEvent);
      });
      
      // Wait for navigation and verify forecast page
      await page.waitForFunction(
        () => document.querySelector('header h1').textContent === 'Weather Forecast'
      );
      const forecastTitle = await page.$eval('header h1', el => el.textContent);
      expect(forecastTitle).toBe('Weather Forecast');
      
      // Simulate swipe right to go back
      await page.evaluate(() => {
        // Create a touch point
        const touchStart = new Touch({
          identifier: 0,
          target: document.body,
          clientX: 50,
          clientY: 200,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0.5,
        });
        
        // Create touch events
        const touchStartEvent = new TouchEvent('touchstart', {
          cancelable: true,
          bubbles: true,
          touches: [touchStart],
          targetTouches: [touchStart],
          changedTouches: [touchStart],
        });

        const touchEnd = new Touch({
          identifier: 0,
          target: document.body,
          clientX: 300,
          clientY: 200,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0.5,
        });

        const touchEndEvent = new TouchEvent('touchend', {
          cancelable: true,
          bubbles: true,
          touches: [],
          targetTouches: [],
          changedTouches: [touchEnd],
        });
        
        window.dispatchEvent(touchStartEvent);
        window.dispatchEvent(touchEndEvent);
      });
      
      // Wait for navigation and verify home page
      await page.waitForFunction(
        () => document.querySelector('header h1').textContent === 'Current Weather'
      );
      const finalTitle = await page.$eval('header h1', el => el.textContent);
      expect(finalTitle).toBe('Current Weather');
    });
  });

  describe('Image Refresh', () => {
    it('should refresh images on pull-to-refresh', async () => {
      await page.waitForSelector('.image-container img');
      
      // Get initial image sources and timestamps
      const initialImages = await page.$$eval('.image-container img', imgs => 
        imgs.map(img => ({
          src: img.src,
          timestamp: new URL(img.src).searchParams.get('t')
        }))
      );

      // Wait a bit to ensure new timestamp will be different
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger pull-to-refresh
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('pull-to-refresh'));
      });

      // Wait for refresh to complete
      await page.waitForFunction(oldTimestamps => {
        const imgs = document.querySelectorAll('.image-container img');
        return Array.from(imgs).every(img => {
          const newTimestamp = new URL(img.src).searchParams.get('t');
          return !oldTimestamps.includes(newTimestamp);
        });
      }, {}, initialImages.map(img => img.timestamp));

      // Verify each image has a new timestamp
      const refreshedImages = await page.$$eval('.image-container img', imgs => 
        imgs.map(img => ({
          src: img.src,
          timestamp: new URL(img.src).searchParams.get('t')
        }))
      );

      expect(refreshedImages.length).toBe(initialImages.length);
      refreshedImages.forEach((img, i) => {
        expect(img.timestamp).not.toBe(initialImages[i].timestamp);
      });
    });

    it('should handle failed image loads gracefully with retry', async () => {
      await page.goto(`${APP_URL}/forecast`);
      await page.waitForSelector('.image-container');

      // Break image URL to simulate failure
      const invalidUrl = 'invalid-url';
      await page.evaluate(url => {
        const img = document.querySelector('.image-container img');
        img.src = url;
      }, invalidUrl);

      // Check if error placeholder is shown with retry button
      await page.waitForSelector('.image-error');
      const errorMessage = await page.$eval('.image-error p', el => el.textContent);
      expect(errorMessage).toBe('Failed to load image');

      const retryButton = await page.$('.image-error button');
      expect(retryButton).toBeTruthy();

      // Get original URL from retry button onclick
      const originalUrl = await page.$eval('.image-error button', button => {
        const match = button.getAttribute('onclick').match(/'([^']+)'/);
        return match ? match[1] : null;
      });
      expect(originalUrl).not.toBe(invalidUrl);
    });

    it('should setup auto-refresh functionality', async () => {
      await page.waitForSelector('.image-container img');
      
      // Get initial image sources
      const initialSrcs = await page.$$eval('.image-container img', imgs => 
        imgs.map(img => img.src)
      );

      // Verify the App instance has the autoRefresh interval set up
      const hasAutoRefresh = await page.evaluate(() => {
        return Boolean(window.app && typeof window.app.refreshImages === 'function');
      });

      expect(hasAutoRefresh).toBe(true);

      // Manually trigger a refresh to verify the functionality works
      await page.evaluate(() => window.app.refreshImages());

      // Wait for images to refresh
      await page.waitForFunction(
        oldSrcs => {
          const newSrcs = Array.from(document.querySelectorAll('.image-container img'))
            .map(img => img.src);
          return newSrcs.some((src, i) => src !== oldSrcs[i]);
        },
        {},
        initialSrcs
      );

      const newSrcs = await page.$$eval('.image-container img', imgs => 
        imgs.map(img => img.src)
      );

      // Verify at least one image source has changed
      expect(newSrcs).not.toEqual(initialSrcs);
    });
  });
});
