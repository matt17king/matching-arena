import { defineConfig } from 'vite';

// Relative base so the build works from any host path (root domain, subpath, preview URL).
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
