import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '' : '/carnival2025/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3002,
    strictPort: true,
    hmr: {
      overlay: true,
      timeout: 2000,
      protocol: 'ws',
      host: 'localhost',
      port: 3002
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  clearScreen: false,
  cacheDir: '.vite-cache'
}));