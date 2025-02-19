export default class PageManager {
  constructor(config) {
    this.validateConfig(config);
    this.pages = config.pages;
  }

  validateConfig(config) {
    if (!config || !config.pages) {
      throw new Error('Invalid configuration: pages object is required');
    }

    for (const [key, page] of Object.entries(config.pages)) {
      if (!page.route) {
        throw new Error(`Invalid configuration: route is required for page "${key}"`);
      }
      if (!page.title) {
        throw new Error(`Invalid configuration: title is required for page "${key}"`);
      }
      if (!Array.isArray(page.images)) {
        throw new Error(`Invalid configuration: images array is required for page "${key}"`);
      }
      
      // Validate image objects
      page.images.forEach((image, index) => {
        if (!image.src) {
          throw new Error(`Invalid configuration: image src is required for image ${index} in page "${key}"`);
        }
        if (!image.clickUrl) {
          throw new Error(`Invalid configuration: image clickUrl is required for image ${index} in page "${key}"`);
        }
      });
    }
  }

  getPageByRoute(route) {
    const normalizedRoute = this.normalizeRoute(route);
    return Object.values(this.pages).find(page => page.route === normalizedRoute) || null;
  }

  getPageImages(route) {
    const page = this.getPageByRoute(route);
    return page ? page.images : [];
  }

  getAllRoutes() {
    return Object.values(this.pages).map(page => page.route);
  }

  // Internal method to normalize route paths
  normalizeRoute(route) {
    // Ensure route starts with '/' and remove any trailing '/'
    return '/' + route.replace(/^\/+|\/+$/g, '');
  }
}
