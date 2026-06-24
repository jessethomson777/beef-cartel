import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mobile-first design system. `/preview` is the canonical route (SPA fallback
// means it also resolves at `/`). Server opens on 5173 by default.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
