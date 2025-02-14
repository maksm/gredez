// Notification service for handling push and app notifications
class NotificationService {
  constructor() {
    this.hasNotificationPermission = false;
    this.serviceWorkerRegistration = null;
    this.initializeService();
  }

  // Initialize the notification service
  async initializeService() {
    // Check for notification support
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    try {
      // Get permission status
      this.hasNotificationPermission = await this.requestPermission();
      
      // Get service worker registration
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Show an app notification
  async showNotification(title, options = {}) {
    if (!this.hasNotificationPermission) {
      this.hasNotificationPermission = await this.requestPermission();
      if (!this.hasNotificationPermission) return false;
    }

    // Default options
    const defaultOptions = {
      icon: '/gredez/images/icons/icon-192.png',
      badge: '/gredez/images/icons/icon-96.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      renotify: false,
      tag: 'default'
    };

    try {
      // Use service worker notification if available
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, {
          ...defaultOptions,
          ...options
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          ...defaultOptions,
          ...options
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  // Show weather update notification
  async showWeatherUpdate(data) {
    const title = 'Posodobitev vremena';
    const options = {
      body: `Novi vremenski podatki so na voljo.${data.summary ? `\n${data.summary}` : ''}`,
      tag: 'weather-update',
      data: { type: 'weather-update', timestamp: new Date().toISOString() },
      actions: [
        {
          action: 'view',
          title: 'Prikaži'
        }
      ]
    };

    return this.showNotification(title, options);
  }

  // Show severe weather alert
  async showSevereWeatherAlert(alert) {
    const title = 'Vremensko opozorilo';
    const options = {
      body: alert.description,
      tag: 'severe-weather',
      requireInteraction: true,
      priority: 'high',
      data: { type: 'severe-weather', timestamp: new Date().toISOString(), alert },
      actions: [
        {
          action: 'view',
          title: 'Več informacij'
        },
        {
          action: 'dismiss',
          title: 'Zapri'
        }
      ]
    };

    return this.showNotification(title, options);
  }

  // Show app update notification
  async showUpdateNotification() {
    const title = 'Posodobitev aplikacije';
    const options = {
      body: 'Na voljo je nova verzija aplikacije.',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Posodobi zdaj'
        },
        {
          action: 'later',
          title: 'Kasneje'
        }
      ]
    };

    return this.showNotification(title, options);
  }

  // Show offline mode notification
  async showOfflineModeNotification() {
    const title = 'Način brez povezave';
    const options = {
      body: 'Aplikacija je preklopila v način brez povezave. Prikazani bodo shranjeni podatki.',
      tag: 'offline-mode'
    };

    return this.showNotification(title, options);
  }

  // Handle notification click
  static async handleNotificationClick(event) {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    // Close the notification
    notification.close();

    // Handle different notification types
    switch (data.type) {
      case 'weather-update':
        // Open main weather view
        clients.openWindow('/gredez/');
        break;
      
      case 'severe-weather':
        if (action === 'view') {
          // Open detailed alert view
          clients.openWindow(`/gredez/alert.html?id=${data.alert.id}`);
        }
        break;

      case 'app-update':
        if (action === 'update') {
          // Skip waiting and reload all clients
          self.skipWaiting();
          clients.matchAll().then(clients => {
            clients.forEach(client => client.navigate(client.url));
          });
        }
        break;

      default:
        // Default action - open main view
        clients.openWindow('/gredez/');
        break;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
