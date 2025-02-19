import App from '../../js/app.js';

describe('App Offline Mode', () => {
  let app;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div class="image-container">
        <img src="https://example.com/weather.png" alt="Weather Image">
      </div>
    `;
    
    // Mock service worker registration
    global.navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue({
        active: true
      })
    };

    // Start in online mode
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

  test('should show offline indicator when going offline', () => {
    // Mock header for connection status
    document.body.innerHTML += '<header><h1>Test</h1></header>';
    
    // Simulate going offline
    window.dispatchEvent(new Event('offline'));
    
    // Check connection status shows offline
    const indicator = document.querySelector('.connection-status');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Offline');
    expect(indicator.classList.contains('offline')).toBe(true);
    expect(app.isOffline).toBe(true);
  });

  test('should update indicator when going online', () => {
    // Mock header for connection status
    document.body.innerHTML += '<header><h1>Test</h1></header>';
    
    // Start offline
    window.dispatchEvent(new Event('offline'));
    let indicator = document.querySelector('.connection-status');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Offline');
    expect(indicator.classList.contains('offline')).toBe(true);
    
    // Go back online
    window.dispatchEvent(new Event('online'));
    
    // Check indicator shows online state
    indicator = document.querySelector('.connection-status');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Online');
    expect(indicator.classList.contains('offline')).toBe(false);
    expect(app.isOffline).toBe(false);
  });

  test('should show warning when service worker fails to register', async () => {
    // Use fake timers
    jest.useFakeTimers();
    
    // Mock service worker registration to fail all attempts
    global.navigator.serviceWorker.register.mockRejectedValue(new Error('Registration failed'));
    
    // Create new app instance to trigger service worker registration
    app = new App();
    
    // Helper function to handle each retry cycle
    const handleRetry = async (retryNumber) => {
      await Promise.resolve(); // Let the current rejection happen
      await Promise.resolve(); // Let the retry logic execute
      if (retryNumber < 3) {
        jest.advanceTimersByTime(Math.pow(2, retryNumber + 1) * 1000);
      }
    };

    // Initial attempt
    await Promise.resolve(); // Let the first registration attempt happen
    
    // Handle all retries
    await handleRetry(0); // First retry
    await handleRetry(1); // Second retry
    await handleRetry(2); // Third retry
    
    // Let final failure logic execute
    await Promise.resolve();
    await Promise.resolve();
    
    // Check warning indicator is shown
    const warning = document.querySelector('.connection-status.warning');
    expect(warning).toBeTruthy();
    expect(warning.textContent).toBe('Offline support unavailable');
    
    // Restore real timers
    jest.useRealTimers();
  });
});
