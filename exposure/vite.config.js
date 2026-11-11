import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = p => fileURLToPath(new URL(p, import.meta.url));

// Relative base so the build works from any host path (root domain, subpath, preview URL).
// Two pages: the story (index.html) and the booking page (book/index.html).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: { input: { main: page('./index.html'), book: page('./book/index.html') } },
  },
});
