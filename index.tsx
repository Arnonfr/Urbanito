
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AudioProvider } from './contexts/AudioContext';
import { WalkModeProvider } from './contexts/WalkModeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AudioProvider>
        <WalkModeProvider>
          <App />
        </WalkModeProvider>
      </AudioProvider>
    </BrowserRouter>
  </React.StrictMode>
);

