import { pages } from './config/pages.js';

// Navigation pages (derived from config)
const pageNames = Object.keys(pages);

// Import services and components
import { networkService } from './services/network.js';
import { NetworkStatus } from './components/network-status.js';

// Debounce utility
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Service Worker and Data Management
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.initialized = false;
    this.offlineMode = !navigator.onLine;
    this.ensembleState = new Map();
    this.deferredInstallPrompt = null;
    
    if ('serviceWorker' in navigator) {
      this.initialize();
    }

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.showInstallPrompt();
    });
  }

  async initialize() {
    try {
      this.registration = await navigator.serviceWorker.register('./sw.js', { 
        scope: './' 
      });
      
      // Request persistent storage
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log(`Persisted storage granted: ${isPersisted}`);
      }
      
      this.setupEventListeners();
      this.checkConnectivity();
      this.initialized = true;
      
      // Setup periodic sync if supported
      if ('periodicSync' in this.registration) {
        try {
          await this.registration.periodicSync.register('update-weather', {
            minInterval: 15 * 60 * 1000 // 15 minutes
          });
        } catch (error) {
          console.error('Periodic sync registration failed:', error);
        }
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  setupEventListeners() {
    // Use network service for connectivity changes
    networkService.addListener((isOnline) => {
      this.handleConnectivityChange(isOnline);
    });
  }

  showInstallPrompt() {
    if (this.deferredInstallPrompt) {
      const installBanner = document.createElement('div');
      installBanner.className = 'install-banner';
      installBanner.innerHTML = `
        <div class="install-message">
          Namesti aplikacijo na napravo
          <button class="install-button">Namesti</button>
          <button class="dismiss-button">Zapri</button>
        </div>
      `;
      
      document.body.appendChild(installBanner);
      
      installBanner.querySelector('.install-button').addEventListener('click', async () => {
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('App installed');
        }
        this.deferredInstallPrompt = null;
        installBanner.remove();
      });
      
      installBanner.querySelector('.dismiss-button').addEventListener('click', () => {
        installBanner.remove();
      });
    }
  }

  handleConnectivityChange(isOnline) {
    // Prevent refresh if the online status hasn't actually changed
    if (this.offlineMode === !isOnline) {
      return;
    }
    
    this.offlineMode = !isOnline;
    
    if (isOnline) {
      // Debounce the refresh when coming back online
      this.debouncedRefresh();
    } else {
      // When going offline, ensure cached content is displayed
      this.showCachedContent();
    }
  }

  async showCachedContent() {
    try {
      const cache = await caches.open('pages-cache');
      const currentUrl = window.location.href;
      const cachedResponse = await cache.match(currentUrl);
      
      if (cachedResponse) {
        // Update timestamps to show cached state
        document.querySelectorAll('.image-timestamp').forEach(timestamp => {
          timestamp.classList.add('cached');
          timestamp.textContent = `Shranjeno: ${new Date().toLocaleString('sl-SI')}`;
        });
      }
    } catch (error) {
      console.error('Error showing cached content:', error);
    }
  }

  debouncedRefresh = debounce(() => {
    // Only refresh if we've been offline and are now online
    if (!this.offlineMode) {
      this.refreshData();
    }
  }, 5000); // Wait 5 seconds before refreshing

  async checkConnectivity() {
    try {
      // Check cache status
      const cache = await caches.open('weather-images-cache');
      const keys = await cache.keys();
      const hasCache = keys.length > 0;
      document.body.classList.toggle('has-cache', hasCache);
      
      // Check storage quota
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const percentageUsed = (estimate.usage / estimate.quota) * 100;
        if (percentageUsed > 80) {
          console.warn(`Storage usage high: ${percentageUsed.toFixed(2)}%`);
        }
      }
    } catch (error) {
      console.error('Cache check failed:', error);
    }
  }

  async refreshData() {
    try {
      const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
      
      // Skip refresh for non-weather pages
      if (!pageNames.includes(currentPage)) {
        return;
      }

      if (currentPage === 'gefs' || currentPage === 'epsgram') {
        await this.refreshEnsembleData(currentPage);
      } else {
        // Instead of reloading the page, just refresh the images
        document.querySelectorAll('img').forEach(img => {
          const timestamp = new Date().getTime();
          const url = new URL(img.src);
          url.searchParams.set('t', timestamp);
          img.src = url.toString();
        });
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }

  async refreshEnsembleData(page) {
    try {
      const cache = await caches.open('gredez-ensemble-v1');
      await cache.keys().then(keys => 
        Promise.all(keys.map(key => cache.match(key)))
      );
      // Instead of reloading, refresh specific ensemble images
      const gefsImg = document.getElementById('gefs-img');
      if (gefsImg) {
        const timestamp = new Date().getTime();
        const url = new URL(gefsImg.src);
        url.searchParams.set('t', timestamp);
        gefsImg.src = url.toString();
      }
    } catch (error) {
      console.error('Ensemble refresh failed:', error);
    }
  }
}

// Touch Navigation Setup
class TouchNavigation {
  constructor(container) {
    this.container = container;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50; // minimum distance for swipe

    this.setupEventListeners();
    this.setupPullToRefresh();
  }

  setupEventListeners() {
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    });

    this.container.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].clientX;
      this.handleSwipe();
    });
  }

  setupPullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;
    let lastRefreshTime = 0;
    const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown

    this.container.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });

    this.container.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].clientY;
      const pullDistance = touchEndY - touchStartY;
      const currentTime = Date.now();

      // If pulled down more than 100px and at the top of the page
      // and enough time has passed since last refresh
      if (pullDistance > 100 && window.scrollY === 0 && 
          (currentTime - lastRefreshTime > REFRESH_COOLDOWN)) {
        lastRefreshTime = currentTime;
        // Instead of reloading the whole page, just refresh the images
        document.querySelectorAll('img').forEach(img => {
          const timestamp = new Date().getTime();
          const url = new URL(img.src);
          url.searchParams.set('t', timestamp);
          img.src = url.toString();
        });
      }
    });
  }

  handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) < this.minSwipeDistance) return;

    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const currentIndex = pageNames.indexOf(currentPage);
    
    let nextIndex;
    if (swipeDistance > 0) {
      // Swipe right - go to previous
      nextIndex = currentIndex > 0 ? currentIndex - 1 : pageNames.length - 1;
    } else {
      // Swipe left - go to next
      nextIndex = currentIndex < pageNames.length - 1 ? currentIndex + 1 : 0;
    }

    // Use history.pushState for smoother navigation
    const nextPage = pageNames[nextIndex];
    history.pushState({ page: nextPage }, '', `${nextPage}.html`);
    this.loadPageContent(nextPage);
  }

  async loadPageContent(pageName) {
    try {
      const pageConfig = pages[pageName];
      
      if (!pageConfig) {
        throw new Error(`Page configuration not found for ${pageName}`);
      }
      
      // Update title and source link
      const pageTitle = document.getElementById('page-title');
      const sourceLink = document.getElementById('source-link');
      
      if (pageTitle) pageTitle.textContent = pageConfig.title;
      if (sourceLink) sourceLink.href = pageConfig.sourceUrl;
      
      // Update images
      const imagesContainer = document.getElementById('images-container');
      if (imagesContainer) {
        imagesContainer.innerHTML = '';
        
        pageConfig.images.forEach(imageConfig => {
          const row = document.createElement('div');
          row.className = 'row mt-3';
          
          const col = document.createElement('div');
          col.className = 'col';
          
          const img = document.createElement('img');
          img.style.width = '100%';
          img.className = 'img-responsive';
          img.alt = imageConfig.alt;
          if (imageConfig.id) img.id = imageConfig.id;
          if (imageConfig.src) img.src = imageConfig.src;
          
          col.appendChild(img);
          row.appendChild(col);
          imagesContainer.appendChild(row);
        });
      }
      
      // Update links if present
      const linksContainer = document.getElementById('links-container');
      if (linksContainer) {
        if (pageConfig.links && pageConfig.links.length > 0) {
          const col = document.createElement('div');
          col.className = 'col';
          
          const btnGroup = document.createElement('div');
          btnGroup.className = 'btn-group d-flex';
          
          pageConfig.links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'btn btn-outline-primary';
            a.textContent = link.text;
            btnGroup.appendChild(a);
          });
          
          col.appendChild(btnGroup);
          linksContainer.innerHTML = '';
          linksContainer.appendChild(col);
        } else {
          linksContainer.innerHTML = '';
        }
      }
      
      // Initialize content after all changes
      requestAnimationFrame(() => {
        initializeContent();
      });
    } catch (error) {
      console.error('Error loading page content:', error);
      // Fallback to traditional navigation if loading fails
      window.location.href = `${pageName}.html`;
    }
  }
}

// Load header content
const loadHeader = async () => {
  try {
    const response = await fetch('header.html');
    const html = await response.text();
    const header = document.getElementById('header');
    header.innerHTML = html;
    
    // Re-attach theme toggle listener after header loads
    themeManager?.attachToggleListener();
    
    // Re-apply current theme
    const currentTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = currentTheme;
  } catch (error) {
    console.error('Error loading header:', error);
  }
};

// Theme Management
class ThemeManager {
  constructor() {
    this.isToggling = false;
    this.toggleTimeout = null;
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initialize theme immediately
    this.initializeTheme();
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', (e) => this.handleSystemThemeChange(e));
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  initializeTheme() {
    try {
      const storedTheme = localStorage.getItem('theme');
      const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
      this.setTheme(storedTheme || systemTheme);
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to light theme if localStorage fails
      this.setTheme('light');
    }
  }

  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  toggleTheme = () => {
    // Prevent rapid toggling
    if (this.isToggling) return;
    
    this.isToggling = true;
    clearTimeout(this.toggleTimeout);
    
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.setTheme(newTheme);
    
    // Reset toggle state after delay
    this.toggleTimeout = setTimeout(() => {
      this.isToggling = false;
    }, 300); // Match CSS transition duration
  }

  handleSystemThemeChange(event) {
    // Only update if user hasn't set a preference
    if (!localStorage.getItem('theme')) {
      this.setTheme(event.matches ? 'dark' : 'light');
    }
  }

  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.initializeTheme(); // Re-sync theme when tab becomes visible
    }
  }

  attachToggleListener() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.removeEventListener('click', this.toggleTheme); // Clean up any existing listener
      themeToggle.addEventListener('click', this.toggleTheme);
    }
  }
}

// Add timestamp to URL to bypass cache
const addTimestamp = (url) => {
  const urlObj = new URL(url);
  urlObj.searchParams.set('t', Date.now());
  return urlObj.toString();
};

// Initialize images with wrappers and timestamps
const initializeImages = () => {
  const template = document.createElement('template');
  template.innerHTML = `
    <div class="image-wrapper">
      <div class="image-timestamp"></div>
    </div>
  `;

  document.querySelectorAll('img').forEach(img => {
    // Skip if already in a wrapper
    if (img.closest('.image-wrapper')) {
      return;
    }
    
    // Clone and insert wrapper
    const wrapper = template.content.firstElementChild.cloneNode(true);
    img.parentNode.insertBefore(wrapper, img);
    wrapper.insertBefore(img, wrapper.firstElementChild);
    const timestamp = wrapper.querySelector('.image-timestamp');

    // Track retry count
    let retryCount = 0;
    const maxRetries = 3;
    
    // Update timestamp once per image load
    const updateTimestamp = async () => {
      try {
        const response = await fetch(img.src, { method: 'HEAD' });
        const cachedTime = response.headers.get('x-cached-time');
        timestamp.textContent = cachedTime ? 
          `Meritev: ${new Date(cachedTime).toLocaleString('sl-SI')}` :
          `V živo: ${new Date().toLocaleString('sl-SI')}`;
        timestamp.classList.toggle('cached', !!cachedTime);
      } catch {
        timestamp.textContent = `Shranjeno: ${new Date().toLocaleString('sl-SI')}`;
        timestamp.classList.add('cached');
      }
    };

    // Single function for load handling
    const handleLoad = () => img.complete && requestAnimationFrame(() => {
      img.classList.remove('error');
      img.classList.add('loaded');
      timestamp.classList.remove('error');
      updateTimestamp();
      // Reset retry count on successful load
      retryCount = 0;
    });

    // Error handling with retries
    const handleError = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        // Add timestamp and retry loading
        const originalSrc = img.src.split('?')[0];
        img.src = addTimestamp(originalSrc);
        timestamp.textContent = `Poskus ${retryCount}/${maxRetries}...`;
      } else {
        requestAnimationFrame(() => {
          img.classList.add('error');
          img.setAttribute('alt', 'Napaka pri nalaganju slike');
          timestamp.textContent = 'Napaka pri nalaganju';
          timestamp.classList.add('error');
          
          // Add retry button
          const retryButton = document.createElement('button');
          retryButton.textContent = 'Poskusi znova';
          retryButton.className = 'retry-button';
          retryButton.onclick = () => {
            retryCount = 0;
            const originalSrc = img.src.split('?')[0];
            img.src = addTimestamp(originalSrc);
          };
          timestamp.appendChild(retryButton);
        });
      }
    };

    // Add event listeners and check initial state
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    
    // Initial load with timestamp
    if (img.src) {
      img.src = addTimestamp(img.src);
    }
  });
};

// Set up GEFS image if it exists
const initializeGEFSImage = () => {
  const gefsImg = document.getElementById('gefs-img');
  if (gefsImg) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    gefsImg.src = `https://modeles16.meteociel.fr/modeles/gensp/runs/${today}00/graphe3_10000___14.2452830189_45.7894736842_.gif`;
  }
};

// Initialize content
const initializeContent = () => {
  // Initialize all images
  initializeImages();
  // Set up GEFS image if needed
  initializeGEFSImage();
};

// Initialize
let themeManager;

// Handle browser back/forward navigation
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.page) {
    const touchNav = document.getElementById('main_container')?._touchNav;
    if (touchNav) {
      touchNav.loadPageContent(event.state.page);
    }
  }
});

// Initialize network status component
const initializeNetworkStatus = () => {
  // Remove any existing network status element
  const existingStatus = document.querySelector('network-status');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // Add new network status element
  const networkStatus = document.createElement('network-status');
  document.body.insertBefore(networkStatus, document.body.firstChild);
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize network status component
    initializeNetworkStatus();
    themeManager = new ThemeManager();
    
    // Load header first
    await loadHeader();
    
    // Initialize touch navigation
    const mainContainer = document.getElementById('main_container');
    if (mainContainer) {
      const touchNav = new TouchNavigation(mainContainer);
      // Store TouchNavigation instance for popstate handling
      mainContainer._touchNav = touchNav;
      
      // Get current page from URL or default to index
      let currentPage = window.location.pathname.split('/').pop().replace('.html', '');
      // Handle root path
      if (!currentPage || currentPage === '') {
        currentPage = 'index';
      }
      // Load initial page content
      await touchNav.loadPageContent(currentPage);
    } else {
      console.error('Main container not found');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// Initialize Service Worker Manager
let swManager;
window.addEventListener('load', () => {
  swManager = new ServiceWorkerManager();
});
