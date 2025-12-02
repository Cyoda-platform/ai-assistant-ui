import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: 'default',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        timeout: 0, // Disable timeout for SSE streams
        proxyTimeout: 0, // Disable proxy timeout
        configure: (proxy, _options) => {
          // Configure http-proxy for SSE support
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Set no timeout on the proxy request
            proxyReq.setTimeout(0);
            // Disable buffering for SSE
            if (req.url?.includes('/stream')) {
              proxyReq.setHeader('X-Accel-Buffering', 'no');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Disable timeout on the response
            proxyRes.setTimeout(0);
          });
        },
      }
    }
  }
})
