import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      disable: process.env.NODE_ENV === 'development',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Completely skip puzzles.json from any caching
        navigateFallbackDenylist: [/\/puzzles\.json/]
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
    host: '0.0.0.0', // Allow connections from any host (needed for ngrok)
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app', // Allow any ngrok-free.app subdomain
      '.ngrok.io', // Allow any ngrok.io subdomain
      '.ngrok.app', // Allow any ngrok.app subdomain
      '.loca.lt', // Allow LocalTunnel domains
      '.trycloudflare.com', // Allow Cloudflare tunnel domains
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})