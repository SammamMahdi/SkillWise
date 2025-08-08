import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../localhost+1-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../localhost+1.pem'))
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}) 