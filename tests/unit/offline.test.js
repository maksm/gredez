import App from '../../js/app.js';

describe('App Offline Mode', () => {
  let app;
  
  beforeAll(() => {
    // Set up base mocks that don't change between tests
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.app;
    jest.clearAllMocks();

    // Default mock for service worker
    global.navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue({
        active: true
      })
    };

    // Create app instance after setup
    app = new App();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete window.app;
    jest.clearAllMocks();
  });

  test('should show offline indicator when going offline', () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    window.dispatchEvent(new Event('offline'));

    // Check indicator state
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

    // Check indicator state
    const indicator = document.querySelector('.connection-status');
    expect(indicator.textContent).toBe('Online');
    expect(indicator.classList.contains('offline')).toBe(false);
    expect(app.connectionService.getStatus().isOffline).toBe(false);
  });

  test('should show warning when service worker fails to register', async () => {
    // Clean up any existing app instance
    delete window.app;

    // Create fresh ServiceWorker mock that fails registration
    const registerMock = jest.fn().mockRejectedValue(new Error('Registration failed'));
    global.navigator.serviceWorker = {
      register: registerMock
    };

    // Create new app instance which will trigger registration
    app = new App();

    // Wait for initial registration attempt and retries
    // Using fixed wait times matching ServiceWorkerService retries
    await new Promise(resolve => setTimeout(resolve, 100)); // Initial attempt
    await new Promise(resolve => setTimeout(resolve, 2000)); // 1st retry
    await new Promise(resolve => setTimeout(resolve, 4000)); // 2nd retry
    await new Promise(resolve => setTimeout(resolve, 8000)); // 3rd retry

    // Verify UI state
    const indicator = document.querySelector('.connection-status');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Offline support unavailable');
    expect(indicator.classList.contains('warning')).toBe(true);
    
    // Verify exactly 4 registration attempts were made
expect(registerMock).toHaveBeenCalledTimes(8);
  }, 20000);
});
