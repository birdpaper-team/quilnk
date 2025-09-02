import type { App } from "vue";

export const installer = (components: any[] = []) => {
  const install = (app: App) => {
    components.forEach((c: any) => {
      if (typeof c === "function" || typeof c.install === "function") {
        app.use(c);
      } else {
        app.component(c?.name, c);
      }
    });
  };

  return {
    version: "1.0.0",
    install,
  };
};
