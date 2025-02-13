// Navigation pages
const pages = [
  'index.html',
  'radar.html',
  'aladin.html',
  'epsgram.html',
  'blitz.html',
  'gefs.html'
];

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/gredez/sw.js', { scope: '/gredez/' })
      .then(registration => {
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show refresh button or auto-refresh
              if (confirm('Nova verzija aplikacije je na voljo. Posodobi zdaj?')) {
                newWorker.postMessage('SKIP_WAITING');
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => console.error('Service Worker registration failed:', error));
  });
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

    window.location.href = pages[nextIndex];
  }
}

// Load header content
const loadHeader = async () => {
  try {
    const response = await fetch('header.html');
    const html = await response.text();
    document.getElementById('header').innerHTML = html;
  } catch (error) {
    console.error('Error loading header:', error);
  }
};

// Theme Management
const initializeTheme = () => {
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Check stored preference
  const storedTheme = localStorage.getItem('theme');
  // Set theme
  document.documentElement.dataset.theme = storedTheme || (prefersDark ? 'dark' : 'light');
  updateThemeToggle();
};

const updateThemeToggle = () => {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const span = toggle.querySelector('span');
    span.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
  }
};

const toggleTheme = () => {
  const newTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  updateThemeToggle();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme immediately
  initializeTheme();
  
  loadHeader().then(() => {
    // Add theme toggle listener after header loads
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  });
  
  const mainContainer = document.getElementById('main_container');
  if (mainContainer) {
    new TouchNavigation(mainContainer);
  }

  // Add loading state and timestamp to images
  document.querySelectorAll('img').forEach(img => {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    
    const timestamp = document.createElement('div');
    timestamp.className = 'image-timestamp';
    wrapper.appendChild(timestamp);

    // Function to update timestamp display
    const updateTimestamp = async () => {
      try {
        const response = await fetch(img.src, { method: 'HEAD' });
        const cachedTime = response.headers.get('x-cached-time');
        if (cachedTime) {
          const measurementTime = new Date(cachedTime);
          timestamp.textContent = `Meritev: ${measurementTime.toLocaleString('sl-SI')}`;
          timestamp.classList.add('cached');
        } else {
          timestamp.textContent = `V živo: ${new Date().toLocaleString('sl-SI')}`;
          timestamp.classList.remove('cached');
        }
      } catch (error) {
        timestamp.textContent = `Shranjeno: ${new Date().toLocaleString('sl-SI')}`;
        timestamp.classList.add('cached');
      }
    };

    img.addEventListener('load', () => {
      img.classList.add('loaded');
      updateTimestamp();
    });
    
    img.addEventListener('error', () => {
      img.classList.add('error');
      img.setAttribute('alt', 'Napaka pri nalaganju slike');
      timestamp.textContent = 'Napaka pri nalaganju';
      timestamp.classList.add('error');
    });
  });
});

// Theme persistence across page loads
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Re-apply theme when returning to tab
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      document.documentElement.dataset.theme = storedTheme;
      updateThemeToggle();
    }
  }
});

// Handle offline/online events
window.addEventListener('online', () => {
  document.body.classList.remove('offline');
  window.location.reload();
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline');
});
