import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5201,
    proxy: {
      '/api': 'http://localhost:8020',
      '/uploads': 'http://localhost:8020',
    },
    allowedHosts: true,
  },
});
