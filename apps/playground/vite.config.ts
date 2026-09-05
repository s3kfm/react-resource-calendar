import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageSource = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/react-resource-calendar/src/index.ts',
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Use package source in development and playground builds for instant HMR.
      'react-resource-calendar': packageSource,
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    strictPort: true,
    fs: {
      allow: ['../..'],
    },
  },
});
