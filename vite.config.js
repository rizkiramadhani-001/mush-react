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
  },
})
