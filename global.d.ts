declare module "vue" {
  export interface GlobalComponents {
    QuilnkEditor: typeof import("quilnk")["Editor"];
    QuilnkViewer: typeof import("quilnk")["Viewer"];
  }
}

export {};
