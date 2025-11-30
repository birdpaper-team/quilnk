// 全局类型定义

declare module 'quilnk' {
  import { App } from 'vue';
  
  export const QuilnkEditor: any;
  export const QuilnkViewer: any;
  export type QuilnkEditorInstance = any;
  export type QuilnkViewerInstance = any;
  
  export const install: (app: App) => void;
  
  const quilnk: {
    install: (app: App) => void;
  };
  
  export default quilnk;
}

declare module 'quilnk/es' {
  export * from 'quilnk';
}

declare module 'quilnk/lib' {
  export * from 'quilnk';
}
