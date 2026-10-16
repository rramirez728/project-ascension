import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** @see https://vite.dev/guide/static-deploy.html#github-pages */
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
