import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'
  return {
    plugins: [react()],
    define: {
      global: 'globalThis'
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true, secure: false },
        '/gateway': { target: backendUrl, changeOrigin: true, secure: false },
        '/ws': { target: backendUrl, changeOrigin: true, ws: true, secure: false }
      }
    }
  }
})
