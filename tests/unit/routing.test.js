import App from '../../js/app.js';

describe('App Navigation', () => {
  let app;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = '';
    
    // Mock service worker registration
    global.navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue({
        active: true
      })
    };

    // Set up history and location mocking
    const mockLocation = new URL('http://localhost/');
    delete window.location;
    window.location = mockLocation;
    
    // Mock history API
    const originalHistory = window.history;
    const mockHistory = {
      state: null,
      pushState: jest.fn((state, title, url) => {
        mockLocation.pathname = url;
        mockHistory.state = state;
      }),
      back: jest.fn(() => {
        mockLocation.pathname = '/';
        window.dispatchEvent(new Event('popstate'));
      }),
      forward: jest.fn(() => {
        mockLocation.pathname = '/napoved';
        window.dispatchEvent(new Event('popstate'));
      })
    };
    
    delete window.history;
    window.history = mockHistory;
    
    app = new App();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should render home page by default', () => {
    // Verify home page content
    const title = document.querySelector('h1');
    expect(title.textContent).toBe('Trenutno');
    
    // Check if images are rendered
    const images = document.querySelectorAll('.image-container img');
    expect(images.length).toBe(4); // Home page has 4 images
    
    // Verify navigation link states
    const navLinks = document.querySelectorAll('nav a');
    const homeLink = Array.from(navLinks).find(link => link.textContent === 'Trenutno');
    expect(homeLink.classList.contains('active')).toBe(true);
  });

  test('should navigate to forecast page', () => {
    // Find and click forecast link
    const navLinks = document.querySelectorAll('nav a');
    const forecastLink = Array.from(navLinks).find(link => link.textContent === 'Napoved');
    forecastLink.click();
    
    // Verify URL change
    expect(window.location.pathname).toBe('/napoved');
    
    // Force a re-render since the click event's default was prevented
    app.render();
    
    // Verify forecast page content
    const title = document.querySelector('h1');
    expect(title.textContent).toBe('Napoved');
    
    // Check if correct image is rendered
    const images = document.querySelectorAll('.image-container img');
    expect(images.length).toBe(11); // Forecast page has 11 images
    
    // Verify navigation link states - need to get fresh reference after re-render
    const updatedForecastLink = Array.from(document.querySelectorAll('nav a'))
      .find(link => link.textContent === 'Napoved');
    expect(updatedForecastLink.classList.contains('active')).toBe(true);
  });

  test('should handle back/forward navigation', () => {
    // Navigate to forecast page
    const navLinks = document.querySelectorAll('nav a');
    const forecastLink = Array.from(navLinks).find(link => link.textContent === 'Napoved');
    forecastLink.click();
    app.render();
    
    // Verify initial navigation
    expect(window.location.pathname).toBe('/napoved');
    let title = document.querySelector('h1');
    expect(title.textContent).toBe('Napoved');
    
    // Simulate back navigation
    window.history.back();
    app.render();
    
    // Verify we're back on home page
    expect(window.location.pathname).toBe('/');
    title = document.querySelector('h1');
    expect(title.textContent).toBe('Trenutno');
    const homeLink = Array.from(document.querySelectorAll('nav a'))
      .find(link => link.textContent === 'Trenutno');
    expect(homeLink.classList.contains('active')).toBe(true);
    
    // Simulate forward navigation
    window.history.forward();
    app.render();
    
    // Verify we're back on forecast page
    expect(window.location.pathname).toBe('/napoved');
    title = document.querySelector('h1');
    expect(title.textContent).toBe('Napoved');
    const updatedForecastLink = Array.from(document.querySelectorAll('nav a'))
      .find(link => link.textContent === 'Napoved');
    expect(updatedForecastLink.classList.contains('active')).toBe(true);
  });
});
