import vue from "@vitejs/plugin-vue";
import { join } from "path";
import { compRoot, distPkgRoot } from "../paths";
import { build } from "vite";

export async function buildBundle() {

  const name = "Quilnk";
  const entryFileName = "quilnk";

  const fileName = (format: string) => `${entryFileName}.${format === "es" ? "mjs" : format === "cjs" ? "cjs" : "js"}`;

  return await build({
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    plugins: [vue()],
    build: {
      outDir: join(distPkgRoot, "dist"),
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      lib: {
        entry: compRoot,
        formats: ["es", "cjs", "iife"],
        name,
        fileName,
      },
    },
  });
}
