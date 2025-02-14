export class NetworkStatus extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    this.setupListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: #fff3cd;
          color: #856404;
          padding: 0.75rem;
          text-align: center;
          z-index: 1050;
          border-bottom: 1px solid #ffeeba;
          font-family: system-ui, -apple-system, sans-serif;
        }
        :host([offline]) {
          display: block;
        }
        .message {
          margin: 0;
        }
        .retry {
          background: none;
          border: none;
          color: #0d6efd;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
        }
        .retry:hover {
          color: #0a58ca;
        }
      </style>
      <div class="message">
        Trenutno ste brez povezave z internetom. Prikazani so zadnji shranjeni podatki.
        <button class="retry">Poskusi ponovno</button>
      </div>
    `;
  }

  setupListeners() {
    // Update status when online/offline status changes
    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());
    
    // Initial status check
    this.updateStatus();
    
    // Retry button handler
    this.shadowRoot.querySelector('.retry').addEventListener('click', () => {
      window.location.reload();
    });
  }

  updateStatus() {
    if (!navigator.onLine) {
      this.setAttribute('offline', '');
    } else {
      this.removeAttribute('offline');
    }
  }
}

// Register custom element
customElements.define('network-status', NetworkStatus);
