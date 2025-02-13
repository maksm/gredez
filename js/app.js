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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  
  const mainContainer = document.getElementById('main_container');
  if (mainContainer) {
    new TouchNavigation(mainContainer);
  }

  // Add loading state to images
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
    
    img.addEventListener('error', () => {
      img.classList.add('error');
      img.setAttribute('alt', 'Napaka pri nalaganju slike');
    });
  });

  // Add timestamp to cached content
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  timestamp.textContent = `Zadnja posodobitev: ${new Date().toLocaleString('sl-SI')}`;
  mainContainer.appendChild(timestamp);
});

// Handle offline/online events
window.addEventListener('online', () => {
  document.body.classList.remove('offline');
  window.location.reload();
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline');
});
