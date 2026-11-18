import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = p => fileURLToPath(new URL(p, import.meta.url));

// Relative base so the build works from any host path (root domain, subpath, preview URL).
// Three pages: the story (index.html), the booking page (book/index.html) and the virtual world (world/index.html).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: { input: { main: page('./index.html'), book: page('./book/index.html'), world: page('./world/index.html') } },
  },
});
