import { distPkgRoot, themeRoot } from "../paths";
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
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: files,
        output: {
          dir: outDir,
          assetFileNames: "[name][extname]",
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  });
}
