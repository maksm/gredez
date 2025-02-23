export class ServiceWorkerService {
  constructor(basePath = '') {
    this.basePath = basePath;
    this.maxRetries = 3;
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return null;
    }

    let retries = 0;
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(this.basePath + '/sw.js');
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
        
        return registration;
      } catch (error) {
        console.error(`ServiceWorker registration failed: ${error}`);
        
        if (retries < this.maxRetries) {
          retries++;
          console.log(`Retrying ServiceWorker registration (${retries}/${this.maxRetries})...`);
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
        return null;
      }
    };

    return registerSW();
  }
}

export default ServiceWorkerService;
