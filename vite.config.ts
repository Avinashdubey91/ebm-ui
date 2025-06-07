import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace with your backend API port (adjust if different)
const backendUrl = 'https://localhost:5001';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false, // Set to true if using a valid HTTPS cert
      },
    },
  },
});
