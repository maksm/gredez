import App from '../../js/app.js';

describe('Theme Management', () => {
  let app;

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.clear();
    
    // Mock DOM structure
    document.body.innerHTML = `
      <header>
        <h1>Test Page</h1>
        <nav></nav>
      </header>
    `;
    
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

  test('should initialize with light theme by default', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('should create theme toggle button in correct header position', () => {
    const header = document.querySelector('header');
    const children = Array.from(header.children);
    
    // Check element order: h1 -> connection-status -> theme-toggle -> hamburger -> nav
    expect(children[0].tagName).toBe('H1');
    expect(children[1].classList.contains('connection-status')).toBe(true);
    expect(children[2].classList.contains('theme-toggle')).toBe(true);
    expect(children[3].classList.contains('hamburger')).toBe(true);
    expect(children[4].tagName).toBe('NAV');
  });

  test('should toggle theme when button is clicked', () => {
    const themeToggle = document.querySelector('.theme-toggle');
    
    // Click to switch to dark mode
    themeToggle.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    
    // Click to switch back to light mode
    themeToggle.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('should load persisted theme on initialization', () => {
    // Set dark theme in localStorage
    localStorage.setItem('theme', 'dark');
    
    // Create new app instance
    app = new App();
    
    // Check if dark theme is applied
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    const themeToggle = document.querySelector('.theme-toggle');
    expect(themeToggle.classList.contains('active')).toBe(true);
  });

  test('should maintain theme during navigation', () => {
    // Switch to dark theme
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    // Trigger a re-render (simulating navigation)
    app.render();
    
    // Check theme is preserved
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    const newThemeToggle = document.querySelector('.theme-toggle');
    expect(newThemeToggle.classList.contains('active')).toBe(true);
  });

  test('should preserve theme toggle position in mobile view', () => {
    // Add mobile class to simulate mobile view
    document.documentElement.classList.add('mobile');
    
    // Re-render to trigger mobile layout
    app.render();
    
    const header = document.querySelector('header');
    const children = Array.from(header.children);
    
    // Verify theme toggle position is maintained in mobile layout
    expect(children[2].classList.contains('theme-toggle')).toBe(true);
  });
});
