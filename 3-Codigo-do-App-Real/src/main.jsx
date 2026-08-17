import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof window.storage === 'undefined') {
  window.storage = {
    get(key, _isDurable) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? { value: raw } : null;
      } catch { return null; }
    },
    set(key, value, _isDurable) {
      try { localStorage.setItem(key, value); } catch { /* storage cheio ou bloqueado */ }
    },
    delete(key, _isDurable) {
      try { localStorage.removeItem(key); } catch { /* ignora */ }
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
