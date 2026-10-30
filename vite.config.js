import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Path relatif agar hasil build tetap jalan dibuka langsung maupun dari subpath.
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // Izinkan akses via tunnel (URL trycloudflare.com berubah tiap run).
    allowedHosts: ['.trycloudflare.com'],
    // Teruskan API ke mush-server lokal supaya browser tidak kena CORS.
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/health': 'http://127.0.0.1:8080',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/health': 'http://127.0.0.1:8080',
    },
  },
})
