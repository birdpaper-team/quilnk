import { distPkgRoot, themeRoot, projRoot } from "../paths";
import { build } from "vite";
import { resolve } from "path";
import glob from "fast-glob";

export async function buildTheme() {
  const files = await glob("**/*.scss", {
    cwd: themeRoot,
    absolute: true,
    onlyFiles: true,
  });

  if (files.length === 0) {
    throw new Error(`No .scss files found in ${themeRoot}`);
  }
  const outDir = resolve(distPkgRoot, "theme");

  await build({
    root: themeRoot,
    assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2', '**/*.eot', '**/*.svg'],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: files,
        output: {
          dir: outDir,
          assetFileNames: (assetInfo) => {
            // 分离字体文件到 fonts 目录
            if (assetInfo.name?.endsWith('.woff') || assetInfo.name?.endsWith('.woff2') || assetInfo.name?.endsWith('.ttf') || assetInfo.name?.endsWith('.eot') || assetInfo.name?.endsWith('.svg')) {
              return `fonts/[name][extname]`;
            }
            return `[name][extname]`;
          },
          manualChunks: undefined,
        },
        plugins: [
          // 处理字体文件的插件
          {
            name: 'handle-font-urls',
            transform(code, id) {
              if (id.endsWith('.scss')) {
                // 替换 ~/packages/theme/ 为相对路径
                return code.replace(/~\/packages\/theme\//g, './');
              }
              return null;
            },
          },
        ],
      },
      cssCodeSplit: true,
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
    resolve: {
      alias: {
        // 确保正确解析相对路径
        '@': themeRoot,
        '~': projRoot,
      },
    },
    base: './',
  });
}
