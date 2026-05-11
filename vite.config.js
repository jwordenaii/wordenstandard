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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom", "react-helmet-async"],
          ui: ["lucide-react", "framer-motion", "clsx", "tailwind-merge"],
          three: ["three", "@react-three/fiber", "@react-three/drei"]
        }
      }
    }
  }
})
