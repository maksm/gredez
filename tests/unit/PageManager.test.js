const PageManager = require('../../js/PageManager').default;

describe('PageManager', () => {
  let pageManager;
  const testConfig = {
    pages: {
      home: {
        title: 'Home',
        route: '/',
        images: [
          {
            src: 'https://example.com/image1.png',
            clickUrl: 'https://example.com/link1'
          },
          {
            src: 'https://example.com/image2.png',
            clickUrl: 'https://example.com/link2'
          }
        ]
      },
      forecast: {
        title: 'Forecast',
        route: '/forecast',
        images: [
          {
            src: 'https://example.com/forecast.png',
            clickUrl: 'https://example.com/forecast'
          }
        ]
      }
    }
  };

  beforeEach(() => {
    pageManager = new PageManager(testConfig);
  });

  test('initializes with pages configuration', () => {
    expect(pageManager).toBeDefined();
    expect(Object.keys(pageManager.pages).length).toBe(2);
  });

  test('returns page by route', () => {
    const page = pageManager.getPageByRoute('/');
    expect(page).toBeDefined();
    expect(page.title).toBe('Home');
  });

  test('returns null for invalid route', () => {
    const page = pageManager.getPageByRoute('/invalid');
    expect(page).toBeNull();
  });

  test('returns page images', () => {
    const images = pageManager.getPageImages('/');
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBe(2);
  });

  test('returns empty array for invalid page images', () => {
    const images = pageManager.getPageImages('/invalid');
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBe(0);
  });

  test('returns all page routes', () => {
    const routes = pageManager.getAllRoutes();
    expect(Array.isArray(routes)).toBe(true);
    expect(routes).toContain('/');
    expect(routes).toContain('/forecast');
  });

  test('validates page configuration', () => {
    expect(() => {
      new PageManager({
        pages: {
          invalid: {
            title: 'Invalid'
            // Missing required route
          }
        }
      });
    }).toThrow();
  });
});
