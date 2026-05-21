import { setDefaultSerializationMode } from '@reharik/smart-enum';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
setDefaultSerializationMode('value');

// then the rest of your app bootstrap
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
