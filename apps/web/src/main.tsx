import { setDefaultSerializationMode } from '@reharik/smart-enum';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// Side-effect import: attaches the beforeinstallprompt listener before first
// render — the event can fire before any component mounts.
import './application/installPrompt';
setDefaultSerializationMode('value');

// Built app only: a service worker at scope "/" would also capture the dev
// server, and Vite's HMR/module requests don't need a passthrough in the way.
// Gate on MODE, not PROD — the root .env pins NODE_ENV=development, which Nx
// exports into build tasks and flips PROD false even under `--mode production`.
if (import.meta.env.MODE === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

// then the rest of your app bootstrap
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
