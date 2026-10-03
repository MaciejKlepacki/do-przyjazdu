// Vite + React + Service Worker.
// Service Worker przechowuje zasoby interfejsu, żeby strona otwierała się bez internetu (sekcja 10).
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/offline',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        rollupFormat: 'iife',
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
