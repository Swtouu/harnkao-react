import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'HarnKao — Trip Expense Splitter',
        short_name: 'HarnKao',
        description: 'หารข้าว — Split trip expenses with friends',
        theme_color: '#7B5EA7',
        background_color: '#F9F7FC',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/Harnkao.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'harnkao-fonts' }
          },
          {
            urlPattern: /^https:\/\/api\.exchangerate-api\.com/,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
})
