declare module "vue" {
  export interface GlobalComponents {
    QuilnkEditor: typeof import("quilnk")["QuilnkEditor"];
    QuilnkViewer: typeof import("quilnk")["QuilnkViewer"];
  }
}

export {};
