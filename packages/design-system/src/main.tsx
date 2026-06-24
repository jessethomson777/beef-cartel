import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { injectThemeVars } from './theme/cssVars';
import './theme/global.css';
import { App } from './App';

// Derive the :root CSS custom properties from tokens.ts before first paint.
injectThemeVars();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
