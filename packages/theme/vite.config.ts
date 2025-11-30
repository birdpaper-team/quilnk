import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.scss'),
      name: 'QuilnkTheme',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        manualChunks: undefined
      }
    },
    sourcemap: true,
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
