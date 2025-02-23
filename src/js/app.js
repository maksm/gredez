import config from './config.js';
import PageManager from './PageManager.js';
import {
  ThemeService,
  ConnectionService,
  ServiceWorkerService,
  TimeService,
  ImageService,
  NavigationService
} from './services/index.js';

class App {
  constructor() {
    // Initialize services
    this.pageManager = new PageManager(config);
    this.themeService = new ThemeService();
    this.connectionService = new ConnectionService();
    this.timeService = new TimeService();
    this.imageService = new ImageService(this.timeService, this.connectionService);
    this.navigationService = new NavigationService(this.pageManager);

    // Set up service worker
    this.serviceWorkerService = new ServiceWorkerService(this.pageManager.getFullPath(''));
    this.initializeServiceWorker();

    // Set up route change handler
    this.navigationService.setRouteChangeHandler(() => this.render());

    // Set up image refresh handler
    window.addEventListener('pull-to-refresh', () => {
      this.imageService.refreshImages();
    });

    // Initial render
    this.render();
  }

  async initializeServiceWorker() {
    await this.serviceWorkerService.register();
  }

  async setupAutoRefresh() {
    await this.imageService.setupAutoRefresh();
  }

  createLinksContainer() {
    const route = this.navigationService.getCurrentRoute();
    const page = this.pageManager.getPageByRoute(route) || this.pageManager.getPageByRoute('/');
    
    if (!page.links?.length) return null;
    
    const container = document.createElement('div');
    container.className = 'links-container';
    
    page.links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.text;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      container.appendChild(a);
    });
    
    return container;
  }

  render() {
    const route = this.navigationService.getCurrentRoute();
    const page = this.pageManager.getPageByRoute(route) || this.pageManager.getPageByRoute('/');
    const images = this.pageManager.getPageImages(page.route);

    // Update header
    let header = document.querySelector('header');
    if (!header) {
      header = document.createElement('header');
      document.body.appendChild(header);
    }
    header.innerHTML = `<h1>${page.title}</h1>`;
    this.connectionService.updateOfflineStatus();                        // Adds connection-status after h1
    header.appendChild(this.themeService.createThemeToggleButton());    // Adds theme-toggle next
    header.appendChild(this.navigationService.createHamburgerButton()); // Adds hamburger next
    header.appendChild(this.navigationService.createNavigation());      // Adds nav last
    
    // Add nav overlay
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = this.navigationService.createNavOverlay();
      document.body.appendChild(overlay);
    }

    // Update main content
    let main = document.querySelector('main');
    if (!main) {
      main = document.createElement('main');
      document.body.appendChild(main);
    }
    main.innerHTML = '';

    // Render images
    images.forEach(imageConfig => {
      const container = document.createElement('div');
      container.className = 'image-container';
      
      const link = document.createElement('a');
      link.href = imageConfig.clickUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      const img = document.createElement('img');
      img.src = imageConfig.src;
      img.alt = `Image for ${page.title}`;
      img.onerror = this.imageService.createImageErrorHandler(container);
      
      link.appendChild(img);
      container.appendChild(link);
      main.appendChild(container);
    });

    // Add quick links before footer
    const linksContainer = this.createLinksContainer();
    if (linksContainer) {
      main.appendChild(linksContainer);
    }

    // Add footer
    let footer = document.querySelector('footer');
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    
    // Create footer content
    const copyright = document.createElement('p');
    copyright.textContent = '© 2025 gredez';

    const lastRefresh = document.createElement('p');
    lastRefresh.className = 'last-refresh';
    lastRefresh.textContent = `Zadnja osvežitev: ${this.timeService.getFormattedTimestamp()}`;
    
    // Clear and add new content
    footer.innerHTML = '';
    footer.appendChild(copyright);
    footer.appendChild(lastRefresh);
  }

  static init() {
    if (!window.app) {
      window.app = new App();
    }
    return window.app;
  }

  static async setup() {
    const app = App.init();
    await app.setupAutoRefresh();
    return app;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);

// For better startup performance, run setup tasks after initial render
window.addEventListener('load', App.setup);

// For testing
export default App;
