import { RouteObject } from "react-router-dom";

export type MyRouteObject = RouteObject & {
    /** @name 在菜单中隐藏子节点 */
  hideChildrenInMenu?: boolean;
  /** @name 在菜单中隐藏自己和子节点 */
  hideInMenu?: boolean;
  /** @name 菜单的icon */
  icon?: React.ReactNode;
  /** @name 菜单的名字 */
  name?: string;
  /** @name disable 菜单选项 */
  disabled?: boolean;
  /** @name 指定外链打开形式，同a标签 */
  target?: string;

  children?: MyRouteObject[];
}

// //copy from antd pro
// interface MenuDataItem {
//   /** @name 子菜单 */
//   children?: MenuDataItem[];
//   /** @name 在菜单中隐藏子节点 */
//   hideChildrenInMenu?: boolean;
//   /** @name 在菜单中隐藏自己和子节点 */
//   hideInMenu?: boolean;
//   /** @name 在面包屑中隐藏 */
//   hideInBreadcrumb?: boolean;
//   /** @name 菜单的icon */
//   icon?: React.ReactNode;
//   /** @name 自定义菜单的国际化 key */
//   locale?: string | false;
//   /** @name 菜单的名字 */
//   name?: string;
//   /** @name 用于标定选中的值，默认是 path */
//   key?: string;
//   /** @name disable 菜单选项 */
//   disabled?: boolean;
//   /** @name 路径,可以设定为网页链接 */
//   path?: string;
//   /**
//    * @deprecated 当此节点被选中的时候也会选中 parentKeys 的节点
//    * @name 自定义父节点
//    */
//   parentKeys?: string[];
//   /** @name 隐藏自己，并且将子节点提升到与自己平级 */
//   flatMenu?: boolean;
//   /** @name 指定外链打开形式，同a标签 */
//   target?: string;

//   [key: string]: any;
// }