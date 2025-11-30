import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { rmSync } from 'fs';

// 清理dist目录
rmSync(resolve(__dirname, 'dist'), { recursive: true, force: true });

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist/quilnk',
    lib: {
      entry: resolve(__dirname, 'packages/quilnk/index.ts'),
      name: 'Quilnk',
      fileName: (format) => {
        if (format === 'es') {
          return 'es/index.mjs';
        } else {
          return 'lib/index.cjs';
        }
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue', 'radash', '@vueuse/components', '@vueuse/core', 'birdpaper-icon', 'birdpaper-ui'],
      output: {
        globals: {
          vue: 'Vue',
          radash: 'radash',
          '@vueuse/components': 'VueUseComponents',
          '@vueuse/core': 'VueUseCore',
          'birdpaper-icon': 'BirdpaperIcon',
          'birdpaper-ui': 'BirdpaperUI'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true
  }
});
