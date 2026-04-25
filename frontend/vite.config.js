import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto por defecto para desarrollo; cambiar si está en uso
    port: 5173
  }
})
