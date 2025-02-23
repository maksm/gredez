export class ConnectionService {
  constructor() {
    this.isOffline = !navigator.onLine;
    this.setupEventListeners();
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

  getStatus() {
    return {
      isOffline: this.isOffline
    };
  }
}

export default ConnectionService;
