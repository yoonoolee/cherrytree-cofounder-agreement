import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './contexts/UserContext';

// Enforce HTTPS in production
if (process.env.REACT_APP_ENFORCE_HTTPS === 'true' &&
    process.env.NODE_ENV === 'production' &&
    window.location.protocol === 'http:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
