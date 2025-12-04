import { defineConfig } from "vite";

export default async () => {
  return defineConfig({
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    optimizeDeps: {
      exclude: [
        "@nolebase/vitepress-plugin-enhanced-readabilities/client",
        "vitepress",
      ],
    },
    ssr: {
      noExternal: [
        "@nolebase/vitepress-plugin-enhanced-readabilities",
        "@nolebase/vitepress-plugin-highlight-targeted-heading",
      ],
    },
  });
};
