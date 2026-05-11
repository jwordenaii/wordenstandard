import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  logLevel: 'warn',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [react()],
  build: {
    outDir:    'dist',
    sourcemap: false,
    minify:    'esbuild',
    target:    'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three/fiber') || id.includes('@react-three/drei')) return 'three-world'
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-tools'
          if (id.includes('recharts') || id.includes('@tremor') || id.includes('d3-')) return 'charts'
if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('framer-motion') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('cmdk') || id.includes('vaul') || id.includes('sonner') || id.includes('embla-carousel')) return 'ui-core'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('react-helmet-async') || id.includes('@sentry/react')) return 'react-core'
          if (id.includes('@stripe')) return 'payments'
          return undefined
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    host:       '127.0.0.1',
    port:       5173,
    strictPort: true,
    proxy: {
      '/api': {
        target:       process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  preview: { port: 4173 },
  optimizeDeps: {
    exclude: ['three','@react-three/fiber','@react-three/drei'],
  },
})
