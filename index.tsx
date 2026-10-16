
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'mapbox-gl/dist/mapbox-gl.css';
import App from './App';
import { installMapboxGoogleCompat } from './services/mapbox/googleMapsCompat';
import { AudioProvider } from './contexts/AudioContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { WalkModeProvider } from './contexts/WalkModeContext';

// Map is Mapbox; App.tsx talks to it through the google.maps-compatible layer.
installMapboxGoogleCompat();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <PremiumProvider>
        <AudioProvider>
          <WalkModeProvider>
            <App />
          </WalkModeProvider>
        </AudioProvider>
      </PremiumProvider>
    </BrowserRouter>
  </React.StrictMode>
);

