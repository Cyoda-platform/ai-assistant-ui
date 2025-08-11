import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader'
import fs from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    svgLoader(),
  ],
  server: {
    https: {
      key: fs.readFileSync('./cert/localhost-key.pem'),
      cert: fs.readFileSync('./cert/localhost-cert.pem')
    },
  },
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
  }
})
