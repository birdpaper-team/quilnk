declare module "*.vue" {
  import { App, defineComponent } from "vue";
  const component: ReturnType<typeof defineComponent> & {
    install(app: App): void;
  };
  export default component;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";