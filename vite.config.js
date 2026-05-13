import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  logLevel: "error",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // The three.js bundle (~1MB) is only used by lazy-loaded components
    // (WebGLPersonaAvatar, PropertyVisualizer, GCFloorPlanCanvas). Strip it
    // from the entry's modulepreload graph so the homepage doesn't fetch it.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !d.includes('three-world'))
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'three-world'
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('react-helmet-async')) {
            return 'react-core'
          }
          if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'ui-core'
          }
        }
      }
    }
  }
})
