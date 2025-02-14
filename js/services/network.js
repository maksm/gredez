// Network service for handling online/offline states and sync operations
class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    
    // Setup event listeners
    window.addEventListener('online', () => this.updateNetworkStatus(true));
    window.addEventListener('offline', () => this.updateNetworkStatus(false));
    
    // Setup periodic sync if supported
    this.setupPeriodicSync();
  }

  // Register a state change listener
  addListener(callback) {
    this.listeners.add(callback);
    // Immediately notify of current state
    callback(this.isOnline);
    return () => this.listeners.delete(callback);
  }

  // Update network status and notify listeners
  updateNetworkStatus(online) {
    this.isOnline = online;
    this.notifyListeners();

    // Show appropriate notification
    if (online) {
      this.showOnlineNotification();
    } else {
      this.showOfflineNotification();
    }
  }

  // Notify all registered listeners
  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.isOnline);
    }
  }

  // Show notification when app goes online
  async showOnlineNotification() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('GreDež - Povezava vzpostavljena', {
        body: 'Aplikacija je zdaj povezana z internetom.',
        icon: '/gredez/images/icons/icon-192.png',
        badge: '/gredez/images/icons/icon-96.png',
        tag: 'network-status'
      });
    }
  }

  // Show notification when app goes offline
  async showOfflineNotification() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('GreDež - Ni povezave', {
        body: 'Aplikacija deluje v načinu brez povezave. Prikazani bodo shranjeni podatki.',
        icon: '/gredez/images/icons/icon-192.png',
        badge: '/gredez/images/icons/icon-96.png',
        tag: 'network-status'
      });
    }
  }

  // Setup periodic sync for background updates
  async setupPeriodicSync() {
    if ('periodicSync' in registration) {
      try {
        // Register for periodic sync
        await registration.periodicSync.register('update-weather', {
          minInterval: 15 * 60 * 1000 // 15 minutes
        });
      } catch (error) {
        console.error('Periodic sync registration failed:', error);
      }
    }
  }

  // Check if we can persist data
  async checkStoragePersistence() {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persisted storage granted: ${isPersisted}`);
      return isPersisted;
    }
    return false;
  }

  // Estimate storage usage
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        percentageUsed: (estimate.usage / estimate.quota) * 100
      };
    }
    return null;
  }

  // Request notification permission if needed
  async requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return true;
  }
}

// Export singleton instance
export const networkService = new NetworkService();
