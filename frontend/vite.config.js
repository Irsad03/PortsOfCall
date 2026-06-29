import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GATEWAY_HTTP = 'http://localhost:8080'
const GATEWAY_WS   = 'ws://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: GATEWAY_HTTP,
        changeOrigin: true,
      },
      '/ws-session': { target: GATEWAY_WS, ws: true, changeOrigin: true },
      '/ws-cargo':   { target: GATEWAY_WS, ws: true, changeOrigin: true },
      '/ws-engine':  { target: GATEWAY_WS, ws: true, changeOrigin: true },
    },
  },
})
