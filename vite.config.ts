import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('zustand')) return 'vendor-zustand';
            if (id.includes('framer-motion')) return 'vendor-motion';
            return 'vendor';
          }

          if (id.includes('/src/ui/')) return 'ui';
          if (id.includes('/src/store/')) return 'store';
        },
      },
    },
  },
})
