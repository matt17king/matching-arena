import { defineConfig } from 'vite';

// Relative base so the build works from any host path (root domain, GitHub Pages subpath, etc).
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
