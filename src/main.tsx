import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { client } from './services/appwrite';

void client
  .ping()
  .then(() => {
    console.info('Appwrite ping successful');
  })
  .catch((error) => {
    console.warn('Appwrite ping failed', error);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
