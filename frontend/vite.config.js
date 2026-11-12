import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// =============================================================================
// NEON :: frontend - Configuracion de Vite
// La URL del API se inyecta en build-time mediante VITE_API_URL (por defecto el
// Gateway en http://localhost:3000).
// =============================================================================
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
