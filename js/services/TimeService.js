export class TimeService {
  constructor() {
    this.lastRefreshTimestamp = this.getStoredTimestamp();
  }

  getStoredTimestamp() {
    const storedTimestamp = localStorage.getItem('lastRefreshTimestamp');
    return storedTimestamp ? parseInt(storedTimestamp) : null;
  }

  updateTimestamp() {
    const timestamp = Date.now();
    this.lastRefreshTimestamp = timestamp;
    localStorage.setItem('lastRefreshTimestamp', timestamp.toString());
    return timestamp;
  }

  getFormattedTimestamp() {
    if (!this.lastRefreshTimestamp) {
      return 'Nikoli';
    }

    const now = Date.now();
    const diff = now - this.lastRefreshTimestamp;
    
    if (diff < 60000) { // less than 1 minute
      return 'Pravkar';
    }
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      // Slovenian has different forms for 1, 2, 3-4, and 5+ minutes
      let minuteForm;
      if (minutes === 1) {
        minuteForm = 'minuto';
      } else if (minutes === 2) {
        minuteForm = 'minuti';
      } else if (minutes === 3 || minutes === 4) {
        minuteForm = 'minute';
      } else {
        minuteForm = 'minut';
      }
      return `${minutes} ${minuteForm} nazaj`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      // Slovenian has different forms for 1, 2, 3-4, and 5+ hours
      let hourForm;
      if (hours === 1) {
        hourForm = 'uro';
      } else if (hours === 2) {
        hourForm = 'uri';
      } else if (hours === 3 || hours === 4) {
        hourForm = 'ure';
      } else {
        hourForm = 'ur';
      }
      return `${hours} ${hourForm} nazaj`;
    }
    
    return new Date(this.lastRefreshTimestamp).toLocaleString();
  }

  getCurrentTimestamp() {
    return this.lastRefreshTimestamp;
  }
}

export default TimeService;
