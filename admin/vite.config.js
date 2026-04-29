import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5200,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
    },
  },
})
