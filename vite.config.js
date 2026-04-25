import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

const SITE_URL = 'https://jworden.netlify.app'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    react(),
    sitemap({
      hostname: SITE_URL,
      routes: [
        '/',
        '/services',
        '/about',
        '/contact',
        '/quote',
        '/reviews',
        // Advisory Board top-level
        '/advisory',
        '/advisory/utilities',
        '/advisory/compare',
        '/advisory/legal-strategy',
        '/advisory/contractor-ranker',
        // Category hubs
        '/advisory/licensing',
        '/advisory/construction-law',
        '/advisory/safety',
        '/advisory/contracts',
        '/advisory/prevailing-wage',
        '/advisory/environmental',
        '/advisory/building-codes',
        '/advisory/roads-paving',
      ],
    }),
  ],
  // Provide an empty fallback so the %VITE_GA4_ID% HTML replacement
  // resolves without a build warning when the env var is not set.
  define: {
    'import.meta.env.VITE_GA4_ID': JSON.stringify(env.VITE_GA4_ID || ''),
  },
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
  }
})
