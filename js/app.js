import config from './config.js';
import PageManager from './PageManager.js';

class App {
  constructor() {
    // Initialize timestamps and state first
    const storedTimestamp = localStorage.getItem('lastRefreshTimestamp');
    this.lastRefreshTimestamp = storedTimestamp ? parseInt(storedTimestamp) : null;
    this.theme = localStorage.getItem('theme') || 'light';
    this.isOffline = !navigator.onLine;
    
    // Then initialize components
    this.pageManager = new PageManager(config);
    this.touchStartX = 0;
    this.SWIPE_THRESHOLD = 100; // Minimum swipe distance in pixels
    
    // Setup and initialization
    this.initializeTheme();
    this.setupEventListeners();
    this.initializeServiceWorker();
    this.render();
  }

  initializeTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.initializeTheme();
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.classList.toggle('active', this.theme === 'dark');
      // Update the icon
      themeToggle.innerHTML = this.createThemeToggleIcon();
    }
  }

  getFormattedTimestamp() {
    if (!this.lastRefreshTimestamp) {
      return 'Nikoli';
    }

    const now = Date.now();
    const diff = now - this.lastRefreshTimestamp;
    
    if (diff < 60000) { // less than 1 minute
      return 'Pravkar';
    }
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      // Slovenian has different forms for 1, 2, 3-4, and 5+ minutes
      let minuteForm;
      if (minutes === 1) {
        minuteForm = 'minuto';
      } else if (minutes === 2) {
        minuteForm = 'minuti';
      } else if (minutes === 3 || minutes === 4) {
        minuteForm = 'minute';
      } else {
        minuteForm = 'minut';
      }
      return `${minutes} ${minuteForm} nazaj`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      // Slovenian has different forms for 1, 2, 3-4, and 5+ hours
      let hourForm;
      if (hours === 1) {
        hourForm = 'uro';
      } else if (hours === 2) {
        hourForm = 'uri';
      } else if (hours === 3 || hours === 4) {
        hourForm = 'ure';
      } else {
        hourForm = 'ur';
      }
      return `${hours} ${hourForm} nazaj`;
    }
    
    return new Date(this.lastRefreshTimestamp).toLocaleString();
  }

  createThemeToggleButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML = this.createThemeToggleIcon();
    button.classList.toggle('active', this.theme === 'dark');
    
    button.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    return button;
  }

  createThemeToggleIcon() {
    return this.theme === 'light' 
      ? '<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
  }

  setupEventListeners() {
    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.updateOfflineStatus();
    });

    window.addEventListener('online', () => {
      this.isOffline = false;
      this.updateOfflineStatus();
    });

    window.addEventListener('pull-to-refresh', () => {
      this.refreshImages();
    });

    window.addEventListener('popstate', () => {
      this.render();
    });

    // Pull to refresh touch handling
    let touchStart = 0;
    let pullDistance = 0;
    const PULL_THRESHOLD = 150;
    let pullIndicator = null;

    // Setup touch events for both pull-to-refresh and swipe navigation
    window.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      // Only enable pull-to-refresh when at top of page
      if (window.scrollY === 0) {
        touchStart = e.touches[0].screenY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (touchStart === 0) return;

      pullDistance = e.touches[0].screenY - touchStart;
      
      // Only allow pulling down
      if (pullDistance > 0) {
        // Create or update pull indicator
        if (!pullIndicator) {
          pullIndicator = document.createElement('div');
          pullIndicator.className = 'pull-indicator';
          document.body.appendChild(pullIndicator);
        }
        
        // Scale indicator based on pull distance
        const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
        pullIndicator.style.transform = `scaleY(${progress})`;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      // Handle horizontal swipe navigation
      if (this.touchStartX !== 0) {
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - this.touchStartX;
        
        // Reset touch start position
        this.touchStartX = 0;
        
        // Process swipe if movement exceeds threshold
        if (Math.abs(deltaX) >= this.SWIPE_THRESHOLD) {
          const routes = this.pageManager.getAllRoutes();
          const currentRoute = window.location.pathname;
          const currentIndex = routes.indexOf(currentRoute);
          
          // Calculate next route based on swipe direction
          let nextIndex;
          if (deltaX > 0) { // Swipe right
            nextIndex = currentIndex === 0 ? routes.length - 1 : currentIndex - 1;
          } else { // Swipe left
            nextIndex = currentIndex === routes.length - 1 ? 0 : currentIndex + 1;
          }
          
          // Navigate to next route
          const nextRoute = routes[nextIndex];
          window.history.pushState({}, '', this.pageManager.getFullPath(nextRoute));
          this.render();
        }
      }
      
      // Handle pull-to-refresh
      if (pullDistance >= PULL_THRESHOLD) {
        window.dispatchEvent(new Event('pull-to-refresh'));
      }
      
      // Reset pull-to-refresh state
      touchStart = 0;
      pullDistance = 0;
      if (pullIndicator) {
        pullIndicator.remove();
        pullIndicator = null;
      }
    }, { passive: true });
  }

  async initializeServiceWorker(maxRetries = 3) {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return;
    }

    let retries = 0;
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(this.pageManager.getFullPath('/sw.js'));
        if (!registration) {
          throw new Error('ServiceWorker registration returned undefined');
        }
        
        if (registration.active) {
          console.log('ServiceWorker already active');
        } else {
          // Wait for the service worker to activate
          await new Promise(resolve => {
            if (registration.active) {
              resolve();
            } else {
              registration.addEventListener('activate', () => resolve());
            }
          });
          console.log('ServiceWorker activated successfully');
        }
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
        
        if (retries < maxRetries) {
          retries++;
          console.log(`Retrying ServiceWorker registration (${retries}/${maxRetries})...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          return registerSW();
        }
        
        // After max retries, continue without service worker but notify user
        let statusIndicator = document.querySelector('.connection-status');
        if (!statusIndicator) {
          statusIndicator = document.createElement('div');
          statusIndicator.className = 'connection-status';
          const header = document.querySelector('header');
          const h1 = header.querySelector('h1');
          header.insertBefore(statusIndicator, h1.nextSibling);
        }
        statusIndicator.classList.add('warning');
        statusIndicator.textContent = 'Offline support unavailable';
      }
    };

    await registerSW();
  }

  async setupAutoRefresh() {
    // Perform initial refresh
    await this.refreshImages();
    
    // Then set up regular refresh interval (every 15 minutes)
    setInterval(() => this.refreshImages(), 15 * 60 * 1000);
  }

  async refreshImages() {
    if (this.isOffline) {
      console.log('Skipping refresh - offline mode');
      return;
    }

    const images = document.querySelectorAll('.image-container img');
    const timestamp = Date.now();
    this.lastRefreshTimestamp = timestamp;
    localStorage.setItem('lastRefreshTimestamp', timestamp.toString());

    // Update the footer timestamp
    const lastRefresh = document.querySelector('footer .last-refresh');
    if (lastRefresh) {
      lastRefresh.textContent = `Zadnja osvežitev: ${this.getFormattedTimestamp()}`;
    }
    
    const refreshPromises = Array.from(images).map(async (img) => {
      // Get the clean URL without cache parameters
      const url = img.dataset.originalSrc || this.getCleanUrl(img.src);
      
      try {
        // Create a new URL object to properly handle parameters
        const refreshUrl = new URL(url);
        refreshUrl.searchParams.set('t', timestamp);
        
        // Create a temporary image to verify the new URL loads
        await this.preloadImage(refreshUrl.toString());
        
        // Update the image only after successful preload
        img.src = refreshUrl.toString();
        img.dataset.originalSrc = url;
        img.dataset.lastRefresh = timestamp;
        
        // Remove any error states
        const errorElement = img.parentElement.querySelector('.image-error');
        if (errorElement) {
          errorElement.remove();
        }
      } catch (error) {
        console.error(`Failed to refresh image ${url}:`, error);
        // Keep the existing image, don't update src
      }
    });

    // Wait for all refreshes to complete
    await Promise.allSettled(refreshPromises);
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  getCleanUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove cache-busting parameters
      urlObj.searchParams.delete('t');
      return urlObj.toString();
    } catch (error) {
      console.error('Invalid URL:', url);
      return url;
    }
  }

  updateOfflineStatus() {
    const header = document.querySelector('header');
    let statusIndicator = document.querySelector('.connection-status');
    if (!statusIndicator) {
      statusIndicator = document.createElement('div');
      statusIndicator.className = 'connection-status';
      // Insert after h1, before theme-toggle
      const h1 = header.querySelector('h1');
      header.insertBefore(statusIndicator, h1.nextSibling);
    }
    
    statusIndicator.textContent = this.isOffline ? 'Offline' : 'Online';
    statusIndicator.classList.toggle('offline', this.isOffline);
  }

  createHamburgerButton() {
    const button = document.createElement('button');
    button.className = 'hamburger';
    button.setAttribute('aria-label', 'Toggle menu');
    button.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    
    button.addEventListener('click', () => {
      const nav = document.querySelector('nav');
      const overlay = document.querySelector('.nav-overlay');
      button.classList.toggle('active');
      nav.classList.toggle('active');
      overlay.classList.toggle('active');
    });
    
    return button;
  }

  createNavOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.addEventListener('click', () => {
      const nav = document.querySelector('nav');
      const hamburger = document.querySelector('.hamburger');
      overlay.classList.remove('active');
      nav.classList.remove('active');
      hamburger.classList.remove('active');
    });
    return overlay;
  }

  createNavigation() {
    const nav = document.createElement('nav');
    const routes = this.pageManager.getAllRoutes();
    
    routes.forEach(route => {
      const link = document.createElement('a');
      const page = this.pageManager.getPageByRoute(route);
      link.href = this.pageManager.getFullPath(route);
      link.textContent = page.title;
      
      if (window.location.pathname === route) {
        link.classList.add('active');
      }
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', this.pageManager.getFullPath(route));
        // Close mobile menu when a link is clicked
        const hamburger = document.querySelector('.hamburger');
        const nav = document.querySelector('nav');
        const overlay = document.querySelector('.nav-overlay');
        if (hamburger && nav && overlay) {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
          overlay.classList.remove('active');
        }
        this.render();
      });
      
      nav.appendChild(link);
    });
    
    return nav;
  }

  createLinksContainer() {
    const route = window.location.pathname;
    const page = this.pageManager.getPageByRoute(route) || this.pageManager.getPageByRoute('/');
    
    // Return null if page has no links
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

  async render() {
    const route = window.location.pathname;
    const page = this.pageManager.getPageByRoute(route) || this.pageManager.getPageByRoute('/');
    const images = this.pageManager.getPageImages(page.route);

    // Track current route
    this._lastRoute = window.location.pathname;

    // Update header
    let header = document.querySelector('header');
    if (!header) {
      header = document.createElement('header');
      document.body.appendChild(header);
    }
    header.innerHTML = `<h1>${page.title}</h1>`;
    this.updateOfflineStatus();                        // Adds connection-status after h1
    header.appendChild(this.createThemeToggleButton()); // Adds theme-toggle next
    header.appendChild(this.createHamburgerButton());   // Adds hamburger next
    header.appendChild(this.createNavigation());        // Adds nav last
    
    // Add nav overlay last
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = this.createNavOverlay();
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
      
      img.onerror = () => {
        container.innerHTML = `
          <div class="image-error">
            <p>Failed to load image</p>
            <button onclick="this.parentElement.parentElement.querySelector('img').src = '${imageConfig.src}'">
              Retry
            </button>
          </div>
        `;
      };
      
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
    lastRefresh.textContent = `Zadnja osvežitev: ${this.getFormattedTimestamp()}`;
    
    // Clear and add new content
    footer.innerHTML = '';
    footer.appendChild(copyright);
    footer.appendChild(lastRefresh);

    // Update offline status
    this.updateOfflineStatus();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// For better startup performance, run setup tasks after initial render
window.addEventListener('load', async () => {
  await window.app.setupAutoRefresh();
});

// For testing
export default App;
