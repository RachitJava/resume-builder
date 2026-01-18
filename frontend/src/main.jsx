import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Auto-refresh on app launch (PWA update check)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Helper to check for updates
      const checkForUpdate = () => {
        if (navigator.serviceWorker.controller) {
          registration.update();
        }
      };

      // Check for updates when app is opened
      registration.update();

      // Check when app becomes visible again (background update)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdate();
        }
      });

      // Auto-reload when new version is available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available, reload the page
            console.log('New version available! Reloading...');
            window.location.reload();
          }
        });
      });
    });
  });
}
