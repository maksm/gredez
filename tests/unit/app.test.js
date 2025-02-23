import App from '../../js/app.js';

describe('Connection Status Indicator', () => {
  let app;

  beforeEach(() => {
    // Mock header and navigation
    document.body.innerHTML = `
      <header>
        <h1>Test Page</h1>
        <nav></nav>
      </header>
    `;

    // Mock navigator online status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });

    app = new App();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should create connection status indicator with correct initial state', () => {
    const indicator = document.querySelector('.connection-status');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Online');
    expect(indicator.classList.contains('offline')).toBe(false);
  });

  test('should update indicator when going offline', () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));

    const indicator = document.querySelector('.connection-status');
    expect(indicator.textContent).toBe('Offline');
    expect(indicator.classList.contains('offline')).toBe(true);
    expect(app.connectionService.getStatus().isOffline).toBe(true);
  });

  test('should update indicator when going online', () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));

    // Then go online
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));

    const indicator = document.querySelector('.connection-status');
    expect(indicator.textContent).toBe('Online');
    expect(indicator.classList.contains('offline')).toBe(false);
    expect(app.connectionService.getStatus().isOffline).toBe(false);
  });

  test('should maintain correct position in header', () => {
    const header = document.querySelector('header');
    const children = Array.from(header.children);
    
    // Check element order: h1 -> connection-status -> theme-toggle -> hamburger -> nav
    expect(children[0].tagName).toBe('H1');
    expect(children[1].classList.contains('connection-status')).toBe(true);
    expect(children[2].classList.contains('theme-toggle')).toBe(true);
    expect(children[3].classList.contains('hamburger')).toBe(true);
    expect(children[4].tagName).toBe('NAV');
  });

  test('should persist during page navigation', () => {
    // Simulate navigation by calling render
    app.render();

    const indicator = document.querySelector('.connection-status');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Online');
    
    // Verify position is maintained
    const header = document.querySelector('header');
    const children = Array.from(header.children);
    expect(children[1].classList.contains('connection-status')).toBe(true);
  });
});

describe('Last Refresh Timestamp', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    app = new App();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should update timestamp when images are refreshed', async () => {
    // Set up initial page structure including footer
    app.render();

    // Add image to test refresh
    const main = document.querySelector('main');
    main.innerHTML = `
      <div class="image-container">
        <img src="https://example.com/test.jpg" alt="Test Image">
      </div>
    `;
    
    // Mock Image preload to avoid actual loading
    jest.spyOn(app.imageService, 'preloadImage').mockResolvedValue(true);
    
    await app.imageService.refreshImages();
    
    const timestamp = document.querySelector('footer .last-refresh');
    expect(timestamp).toBeTruthy();
    expect(timestamp.textContent).toBe('Zadnja osvežitev: Pravkar');
  });

  test('should show last refreshed element in footer', () => {
    // Footer should be created by constructor
    const timestamp = document.querySelector('footer .last-refresh');
    expect(timestamp).toBeTruthy();
    expect(timestamp.textContent).toBe('Zadnja osvežitev: Nikoli');
  });

  test('should show "Nikoli" when no refresh has occurred', () => {
    app.render();
    const timestamp = document.querySelector('footer .last-refresh');
    expect(timestamp.textContent).toBe('Zadnja osvežitev: Nikoli');
  });

  test('should persist and restore refresh timestamp from localStorage', async () => {
    // Set a timestamp
    const testTimestamp = Date.now() - 60000; // 1 minute ago
    localStorage.setItem('lastRefreshTimestamp', testTimestamp.toString());
    
    // Create new app instance
    const newApp = new App();
    
    // Force a re-render to ensure the timestamp is properly initialized
    await Promise.resolve();
    newApp.render();
    
    const timestamp = document.querySelector('footer .last-refresh');
    expect(timestamp.textContent).toBe('Zadnja osvežitev: 1 minuto nazaj');
    
    // Clear for other tests
    localStorage.removeItem('lastRefreshTimestamp');
  });
});

describe('App Image Refresh', () => {
  let app;
  
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div class="image-container">
        <img src="https://example.com/weather.png" alt="Weather Image">
      </div>
    `;
    
    // Mock navigator online status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });

    // Mock service worker registration
    global.navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue({
        active: true
      })
    };

    app = new App();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should refresh images with cache-busting parameter', async () => {
    // Mock preloadImage to simulate successful image load
    jest.spyOn(app.imageService, 'preloadImage').mockResolvedValue(true);
    
    // Get initial image
    const img = document.querySelector('.image-container img');
    const originalSrc = img.src;
    
    // Trigger refresh
    await app.imageService.refreshImages();
    
    // Verify changes
    expect(img.src).not.toBe(originalSrc);
    expect(img.src).toMatch(/t=\d+/); // Should have cache-busting timestamp
    expect(img.dataset.originalSrc).toBe('https://example.com/weather.png');
    expect(img.dataset.lastRefresh).toBeDefined();
  });

  test('should handle failed image refresh gracefully', async () => {
    // Mock preloadImage to simulate failed image load
    jest.spyOn(app.imageService, 'preloadImage').mockRejectedValue(new Error('Failed to load'));
    
    // Get initial image
    const img = document.querySelector('.image-container img');
    const originalSrc = img.src;
    
    // Trigger refresh
    await app.imageService.refreshImages();
    
    // Verify image retains original source on error
    expect(img.src).toBe(originalSrc);
    expect(img.dataset.originalSrc).toBeUndefined();
    expect(img.dataset.lastRefresh).toBeUndefined();
  });

  test('should perform initial refresh when app loads', async () => {
    // Create a new app instance
    const app = new App();
    
    // Mock preloadImage to track if it's called
    const preloadSpy = jest.spyOn(app.imageService, 'preloadImage').mockResolvedValue(true);
    
    // Run the setup that would normally happen in DOMContentLoaded
    await app.setupAutoRefresh();
    
    // Verify preloadImage was called
    expect(preloadSpy).toHaveBeenCalled();
    
    // Verify timestamp is updated
    const timestamp = document.querySelector('footer .last-refresh');
    expect(timestamp.textContent).toBe('Zadnja osvežitev: Pravkar');
  });

  test('should skip refresh when offline', async () => {
    // Set offline status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false
    });
    app.connectionService.isOffline = true;
    
    // Mock preloadImage to track if it's called
    const preloadSpy = jest.spyOn(app.imageService, 'preloadImage');
    
    // Trigger refresh
    await app.imageService.refreshImages();
    
    // Verify preloadImage was not called in offline mode
    expect(preloadSpy).not.toHaveBeenCalled();
  });
});
