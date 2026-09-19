import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Mirrors `paths` in tsconfig.app.json; an absolute path so Vitest resolves it too.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Port 3000 is baked into Clerk/Google Maps dev origins and the /localhost command.
  server: { port: 3000, strictPort: true },
  preview: { port: 3000 },
  build: {
    outDir: 'dist',
    // The hosting CSP has no `data:` in font-src/script-src; never inline assets.
    assetsInlineLimit: 0,
  },
});
