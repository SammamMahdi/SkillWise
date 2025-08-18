import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // SSL configuration
  const enableSSL = env.VITE_ENABLE_SSL === 'true'
  const sslCertPath = env.VITE_SSL_CERT_PATH
  const sslKeyPath = env.VITE_SSL_KEY_PATH
  
  let httpsConfig = false
  
  if (enableSSL && sslCertPath && sslKeyPath) {
    const certFullPath = path.resolve(__dirname, sslCertPath)
    const keyFullPath = path.resolve(__dirname, sslKeyPath)
    
    if (fs.existsSync(certFullPath) && fs.existsSync(keyFullPath)) {
      httpsConfig = {
        key: fs.readFileSync(keyFullPath),
        cert: fs.readFileSync(certFullPath)
      }
    } else {
      console.warn('⚠️  SSL certificates not found, falling back to HTTP')
    }
  }

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_DEV_PORT) || 5173,
      host: env.VITE_DEV_HOST || 'localhost',
      https: httpsConfig,
      proxy: {
        '/api': {
          target: env.VITE_SERVER_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying request:', req.method, req.url, '->', env.VITE_SERVER_URL + req.url);
            });
          }
        },
        '/uploads': {
          target: env.VITE_SERVER_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
}) 