import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Globally disable mouse wheel scroll increment/decrement on all number inputs across the entire website
document.addEventListener('wheel', (e) => {
  if (
    (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') ||
    (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number')
  ) {
    e.preventDefault();
    if (document.activeElement && document.activeElement.type === 'number') {
      document.activeElement.blur();
    }
  }
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
