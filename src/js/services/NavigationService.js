export class NavigationService {
  constructor(pageManager) {
    this.pageManager = pageManager;
    this.touchStartX = 0;
    this.SWIPE_THRESHOLD = 100;
    this._lastRoute = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('popstate', () => {
      if (this.onRouteChange) {
        this.onRouteChange();
      }
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
          const currentRoute = this.pageManager.normalizeRoute(window.location.pathname);
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
          this.navigateTo(nextRoute);
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

  navigateTo(route) {
    window.history.pushState({}, '', this.pageManager.getFullPath(route));
    if (this.onRouteChange) {
      this.onRouteChange();
    }
  }

  createNavigation() {
    const nav = document.createElement('nav');
    const routes = this.pageManager.getAllRoutes();
    
    routes.forEach(route => {
      const link = document.createElement('a');
      const page = this.pageManager.getPageByRoute(route);
      link.href = this.pageManager.getFullPath(route);
      link.textContent = page.title;
      
      if (this.pageManager.normalizeRoute(window.location.pathname) === route) {
        link.classList.add('active');
      }
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(route);
        // Close mobile menu when a link is clicked
        const hamburger = document.querySelector('.hamburger');
        const nav = document.querySelector('nav');
        const overlay = document.querySelector('.nav-overlay');
        if (hamburger && nav && overlay) {
          hamburger.classList.remove('active');
          nav.classList.remove('active');
          overlay.classList.remove('active');
        }
      });
      
      nav.appendChild(link);
    });
    
    return nav;
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

  getCurrentRoute() {
    return this.pageManager.normalizeRoute(window.location.pathname);
  }

  setRouteChangeHandler(handler) {
    this.onRouteChange = handler;
  }
}

export default NavigationService;
