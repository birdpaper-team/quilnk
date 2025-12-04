import { nav } from "./nav";
import sidebar from "./sidebar";

export default {
  label: "简体中文",
  lang: "zh-CN",
  title: "Quilnk",
  titleTemplate: "一个基于 Vue3 的书信文本编辑器",
  description: "Quilnk 是一个基于 Vue3 的书信文本编辑器，致力于为用户提供简洁、高效的书信创作体验。",
  themeConfig: {
    nav: nav,
    outline: "deep",
    outlineTitle: "大纲",
    lightModeSwitchTitle: "切换浅色模式",
    darkModeSwitchTitle: "切换深色模式",
    darkModeSwitchLabel: "深色模式",
    returnToTopLabel: "返回顶部",
    langMenuLabel: "切换语言",
    sidebarMenuLabel: "菜单",
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },
    sidebar: sidebar,
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                noResultsText: "无法找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },
};
