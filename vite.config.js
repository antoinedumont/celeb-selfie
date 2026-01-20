import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow external access
    allowedHosts: ['all'], // Allow all hosts (needed for ngrok tunnel)
  },
})
