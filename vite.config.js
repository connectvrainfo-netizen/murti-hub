import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-animation': ['gsap', '@gsap/react', 'lenis'],
          'vendor-virtual': ['@tanstack/react-virtual', 'idb'],
          'vendor-icons': ['lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-validation': ['zod'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'https://murti-hub-5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://murti-hub-5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'https://murti-hub-5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/uptimerobot': {
        target: 'https://murti-hub-5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/ping': {
        target: 'https://murti-hub-5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/healthz': {
        target: 'https://murti-hub-5.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      ignored: ['**/dist/**', '**/*.mp4'],
    },
  },
});
