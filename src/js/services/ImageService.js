export class ImageService {
  constructor(timeService, connectionService) {
    this.timeService = timeService;
    this.connectionService = connectionService;
  }

  async refreshImages() {
    if (this.connectionService.getStatus().isOffline) {
      console.log('Skipping refresh - offline mode');
      return;
    }

    const images = document.querySelectorAll('.image-container img');
    const timestamp = this.timeService.updateTimestamp();

    // Update the footer timestamp
    const lastRefresh = document.querySelector('footer .last-refresh');
    if (lastRefresh) {
      lastRefresh.textContent = `Zadnja osvežitev: ${this.timeService.getFormattedTimestamp()}`;
    }
    
    const refreshPromises = Array.from(images).map(async (img) => {
      // Get the clean URL without cache parameters
      const url = img.dataset.originalSrc || this.getCleanUrl(img.src);
      
      try {
        // Create a new URL object to properly handle parameters
        const refreshUrl = new URL(url);
        refreshUrl.searchParams.set('t', timestamp);
        
        // Create a temporary image to verify the new URL loads
        await this.preloadImage(refreshUrl.toString());
        
        // Update the image only after successful preload
        img.src = refreshUrl.toString();
        img.dataset.originalSrc = url;
        img.dataset.lastRefresh = timestamp;
        
        // Remove any error states
        const errorElement = img.parentElement.querySelector('.image-error');
        if (errorElement) {
          errorElement.remove();
        }
      } catch (error) {
        console.error(`Failed to refresh image ${url}:`, error);
        // Keep the existing image - don't update src when refresh fails
      }
    });

    // Wait for all refreshes to complete
    await Promise.allSettled(refreshPromises);
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  getCleanUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove cache-busting parameters
      urlObj.searchParams.delete('t');
      return urlObj.toString();
    } catch (error) {
      console.error('Invalid URL:', error);
      return url;
    }
  }

  async setupAutoRefresh() {
    // Perform initial refresh
    await this.refreshImages();
    
    // Then set up regular refresh interval (every 15 minutes)
    setInterval(() => this.refreshImages(), 15 * 60 * 1000);
  }

  createImageErrorHandler(container) {
    return () => {
      container.innerHTML = `
        <div class="image-error">
          <p>Failed to load image</p>
          <button onclick="this.parentElement.parentElement.querySelector('img').src = '${container.querySelector('img').src}'">
            Retry
          </button>
        </div>
      `;
    };
  }
}

export default ImageService;
