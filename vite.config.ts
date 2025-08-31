import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MOJI! - Music Guessing Game',
        short_name: 'MOJI!',
        description: 'Real-time emoji music guessing game',
        theme_color: '#0F0F0F',
        background_color: '#0F0F0F',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512', 
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ['08f6aa51ea7c.ngrok-free.app'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})