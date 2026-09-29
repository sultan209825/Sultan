// Ensure fetch can be reassigned without throwing TypeError on Window
try {
  let _fetch = window.fetch;
  if (_fetch) {
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: () => _fetch,
      set: (fn) => {
        _fetch = fn;
      }
    });
  }
} catch {
  // ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
