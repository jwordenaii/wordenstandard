import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

const SITE_URL = 'https://jworden.netlify.app'

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: SITE_URL,
      routes: ['/', '/services', '/about', '/contact', '/quote', '/reviews'],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Code-split by route for faster page loads
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer'
            if (id.includes('react-router')) return 'router'
            return 'vendor'
          }
        },
      },
    },
  },
})
