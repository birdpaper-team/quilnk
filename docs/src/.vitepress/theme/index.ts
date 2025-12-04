import DefaultTheme from "vitepress/theme";
import Layout from "./layout.vue";
import Theme from "vitepress/theme";
import type { EnhanceAppContext } from "vitepress";

// The BirdpaperUI component.
import BirdpaperUI from "birdpaper-ui";
import "birdpaper-ui/dist/index.css";

import BirdpaperIcon from "birdpaper-icon";
import "birdpaper-icon/dist/index.css";

// Document internal component.
import DemoBlock from "../components/demo-block";
import ApiBlock from "../components/api-block";

// import "../../style/index.scss";

export default {
  ...Theme,
  Layout,
  extends: DefaultTheme,
  enhanceApp(ctx: EnhanceAppContext) {
    ctx.app.use(BirdpaperUI);
    ctx.app.use(BirdpaperIcon);

    ctx.app.component("demo-block", DemoBlock);
    ctx.app.component("api-block", ApiBlock);
  },
};
