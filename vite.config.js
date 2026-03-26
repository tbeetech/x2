import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Proxy /api/* → Express backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  css: {
    postcss: true,
  },
  build: {
    // Raise warning threshold to avoid noise; real splits are handled below
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split large vendor libraries into separate cacheable chunks
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/chart.js/') || id.includes('node_modules/react-chartjs-2/')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/react-toastify/') || id.includes('node_modules/lucide-react/')) {
            return 'vendor-ui'
          }
          if (id.includes('node_modules/socket.io-client/') || id.includes('node_modules/socket.io-parser/') || id.includes('node_modules/engine.io-client/')) {
            return 'vendor-socket'
          }
        },
      },
    },
  },
})

