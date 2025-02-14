// Navigation pages
const pages = [
  'index.html',
  'radar.html',
  'aladin.html',
  'epsgram.html',
  'blitz.html',
  'gefs.html'
];

// Import services
import { networkService } from './services/network.js';
import { notificationService } from './services/notifications.js';

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
      // Request notification permission early
      await notificationService.requestPermission();
      
      this.registration = await navigator.serviceWorker.register('/gredez/sw.js', { 
        scope: '/gredez/' 
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
    // Update handling
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          notificationService.showUpdateNotification();
        }
      });
    });

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
    this.offlineMode = !isOnline;
    document.body.classList.toggle('offline', !isOnline);
    
    if (!isOnline) {
      notificationService.showOfflineModeNotification();
    } else {
      this.refreshData();
    }
  }

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
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage === 'gefs.html' || currentPage === 'epsgram.html') {
        await this.refreshEnsembleData(currentPage);
      } else {
        // Clear image caches before reload
        const cache = await caches.open('weather-images-cache');
        const keys = await cache.keys();
        await Promise.all(keys.map(key => cache.delete(key)));
        window.location.reload();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      notificationService.showNotification('Napaka pri posodobitvi', {
        body: 'Poskusite ponovno kasneje.'
      });
    }
  }

  async refreshEnsembleData(page) {
    try {
      const cache = await caches.open('gredez-ensemble-v1');
      await cache.keys().then(keys => 
        Promise.all(keys.map(key => cache.match(key)))
      );
      window.location.reload();
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

    this.container.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });

    this.container.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].clientY;
      const pullDistance = touchEndY - touchStartY;

      // If pulled down more than 100px and at the top of the page
      if (pullDistance > 100 && window.scrollY === 0) {
        window.location.reload();
      }
    });
  }

  handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) < this.minSwipeDistance) return;

    const currentPage = window.location.pathname.split('/').pop();
    const currentIndex = pages.indexOf(currentPage);
    
    let nextIndex;
    if (swipeDistance > 0) {
      // Swipe right - go to previous
      nextIndex = currentIndex > 0 ? currentIndex - 1 : pages.length - 1;
    } else {
      // Swipe left - go to next
      nextIndex = currentIndex < pages.length - 1 ? currentIndex + 1 : 0;
    }

    // Use history.pushState for smoother navigation
    const nextPage = pages[nextIndex];
    history.pushState({ page: nextPage }, '', nextPage);
    this.loadPageContent(nextPage);
  }

  async loadPageContent(page) {
    try {
      const response = await fetch(page);
      const html = await response.text();
      
      // Parse the HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Update main container content
      const mainContainer = document.getElementById('main_container');
      if (mainContainer) {
        // Clear existing content and wrappers
        mainContainer.innerHTML = '';
        
        // Get the new content
        const newContent = doc.getElementById('main_container');
        
        // Copy attributes
        Array.from(newContent.attributes).forEach(attr => {
          mainContainer.setAttribute(attr.name, attr.value);
        });
        
        // Insert new content
        mainContainer.innerHTML = newContent.innerHTML;
        
        // Initialize content immediately after updating DOM
        requestAnimationFrame(() => {
          initializeContent();
        });
      }
    } catch (error) {
      console.error('Error loading page content:', error);
      // Fallback to traditional navigation if fetch fails
      window.location.href = page;
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
      img.classList.add('loaded');
      updateTimestamp();
    });

    // Single function for error handling
    const handleError = () => requestAnimationFrame(() => {
      img.classList.add('error');
      img.setAttribute('alt', 'Napaka pri nalaganju slike');
      timestamp.textContent = 'Napaka pri nalaganju';
      timestamp.classList.add('error');
    });

    // Add event listeners and check initial state
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    handleLoad();
  });
};

// Set up GEFS image if on GEFS page
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

document.addEventListener('DOMContentLoaded', async () => {
  themeManager = new ThemeManager();
  
  // Load header first
  await loadHeader();
  
  // Initialize touch navigation
  const mainContainer = document.getElementById('main_container');
  if (mainContainer) {
    const touchNav = new TouchNavigation(mainContainer);
    // Store TouchNavigation instance for popstate handling
    mainContainer._touchNav = touchNav;
  }

  // Initialize content
  initializeContent();
});

// Initialize Service Worker Manager
let swManager;
window.addEventListener('load', () => {
  swManager = new ServiceWorkerManager();
});
