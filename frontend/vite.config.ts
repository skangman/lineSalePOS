import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['.trycloudflare.com', 'localhost'],
    proxy: {
      '/api': { target: 'http://localhost:3100', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3100', changeOrigin: true },
    },
  },
})
