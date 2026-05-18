import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const bundledWorkspaceDeps = ['@app/agent', '@app/ai', '@app/core', '@app/knowledge'];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: bundledWorkspaceDeps })],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
        external: [
          'electron',
          'better-sqlite3',
          '@lancedb/lancedb',
          'pdf-parse',
          'mammoth',
          'docx',
        ],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: bundledWorkspaceDeps })],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
        external: [
          'electron',
          'better-sqlite3',
          '@lancedb/lancedb',
          'pdf-parse',
          'mammoth',
          'docx',
        ],
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: { rollupOptions: { input: { index: resolve(__dirname, 'src/renderer/index.html') } } },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src/renderer') },
    },
  },
});
