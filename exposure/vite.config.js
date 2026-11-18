import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = p => fileURLToPath(new URL(p, import.meta.url));

// Relative base so the build works from any host path (root domain, subpath, preview URL).
// The reading pages (thinking, work, plays, press) are written by tools/pages.mjs from src/content.js.
// The others: the story (index.html), the booking page (book/index.html) and the virtual world (world/index.html).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: { input: { main: page('./index.html'), book: page('./book/index.html'), world: page('./world/index.html'),
      about: page('./about/index.html'), thinking: page('./thinking/index.html'), work: page('./work/index.html'), plays: page('./plays/index.html'), press: page('./press/index.html') } },
  },
});
