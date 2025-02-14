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
  }

  // Notify all registered listeners
  notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.isOnline);
    }
  }

  // Setup periodic sync for background updates
  async setupPeriodicSync() {
    try {
      // Only proceed if service worker registration is available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if ('periodicSync' in registration) {
          await registration.periodicSync.register('update-weather', {
            minInterval: 15 * 60 * 1000 // 15 minutes
          });
        }
      }
    } catch (error) {
      console.error('Periodic sync registration failed:', error);
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
}

// Export singleton instance
export const networkService = new NetworkService();
