import { head } from "./head";
import { locales } from "./locales/index";

const config: import("vitepress").UserConfig = {
  lastUpdated: false,
  cleanUrls: true,
  appearance: true,
  locales,
  head,
  themeConfig: {
    logo: {
      dark: "https://cos.birdpaper.design/quilnk/v1/logo/quilnk-white.svg",
      light: "https://cos.birdpaper.design/quilnk/v1/logo/quilnk-black.svg",
    },
    siteTitle: false,
    outline: "deep",
    socialLinks: [
      { icon: "npm", link: "https://www.npmjs.com/package/quilnk" },
      {
        icon: "github",
        link: "https://github.com/birdpaper-team/quilnk",
      },
    ],
    search: {
      provider: "local",
    },
  },
  markdown: {
    theme: {
      light: "min-light",
      dark: "min-dark",
    },
  },
};

export default config;
