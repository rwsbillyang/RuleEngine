import React from 'react'
import { ReactNode, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'

import { Cache } from '@rwsbillyang/usecache';


import { NoFoundPage } from './pages/404'

import { MyRoute } from './myPro/MyRoute'
//import { MySimpleLayout } from './myPro/MySimpleLayout'
import { ParamTable } from './pages/basic/ParamTable'
import { ParamTypeTable } from './pages/basic/ParamTypeTable'
import { OpcodeTable } from './pages/basic/OpcodeTable'
import { ConstantTable } from './pages/basic/ConstantTable'
import { DomainTable } from './pages/basic/DomainTable'
import { BasicExpressionTable, ComplexExpressionTable } from './pages/basic/ExpressionTable'
import { RuleTable } from './pages/rule/RuleTable'
import { RuleEdit } from './pages/rule/RuleEdit'
import { ActionTable } from './pages/rule/ActionTable'
import { RuleGroupTable } from './pages/rule/RuleGroupTable'
import { ParamCategoryTable } from './pages/basic/ParamCategory'
import { EnableParamCategory } from './Config'
import MyProLayout, { MyProLayoutProps } from './myPro/MyProLayout';


import {
  GithubFilled,
  InfoCircleOutlined,
  TranslationOutlined,
  ClearOutlined,
  PartitionOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { Tooltip, message } from 'antd';


// 实现懒加载的用Suspense包裹 定义函数
const lazyLoad = (children: ReactNode): ReactNode => {
  return <Suspense fallback={<div>Loading...</div>}>
    {children}
  </Suspense>
}

const menuRoutes: MyRoute[] = [
  {
    path: '/basic',
    id: 'basic',
    icon:<ProfileOutlined />,
    name: "基础数据",
    //element: lazyLoad(<Page2 />),//优先级高于children
    children: [
      {
        path: '/basic/domain',
        name: '领域',
        element: lazyLoad(<DomainTable />)
      },
      {
        path: '/basic/type',
        name: '类型',
        element: lazyLoad(<ParamTypeTable />)
      },
      {
        path: '/basic/operator',
        name: "操作符",
        element: lazyLoad(<OpcodeTable />)
      },
      {
        path: '/basic/constant',
        name: '常量',
        element: lazyLoad(<ConstantTable />)
      },
      {
        path: '/basic/paramCategory',
        name: '变量分类',
        hideInMenu: !EnableParamCategory,
        element: lazyLoad(<ParamCategoryTable />)
      },
      {
        path: '/basic/param',
        name: '变量',
        element: lazyLoad(<ParamTable />)
      },
      {
        path: '/basic/basicExpression',
        name: '基本表达式',
        element: lazyLoad(<BasicExpressionTable />)
      },
      {
        path: '/basic/complexExpression',
        name: '复合表达式',
        element: lazyLoad(<ComplexExpressionTable />)
      }
    ]
  },
  {
    path: '/rule',
    icon:<PartitionOutlined />,
    id: 'rule',
    name: "规则",
    children: [
      {
        path: '/rule/action',
        name: '动作',
        element: lazyLoad(<ActionTable />)
      },
      {
        path: '/rule/list',
        name: '规则',
        element: lazyLoad(<RuleTable />)
      },
      {
        path: '/rule/editRule',
        name: '编辑规则',
        hideInMenu: true,
        element: lazyLoad(<RuleEdit />)
      },
      {
        path: '/rule/group',
        name: '规则组',
        element: lazyLoad(<RuleGroupTable />)
      }
    ]
  }
]



const proLayoutProps: MyProLayoutProps = {
  title: "Rule Composer",
  //logo: null,
  //layout: 'mix',
  //dark: true, //bugfix sidebar弹出菜单与菜单字体色一致看不清

  route: {
    path: '/',
    children: menuRoutes  //路由嵌套，子路由的元素需使用<Outlet />
  },
  //siderMenuType: "group",
  menu: {
    collapsedShowGroupTitle: true,
    locale: true
  },
  menuFooterRender: (props) => {
    if (props?.collapsed) return undefined;
    return (
      <div
        style={{
          textAlign: 'center',
          paddingBlockStart: 12,
        }}
      >
        <div> © 2023 RuleComposer</div>
        <div>by rwsbillyang@qq.com</div>
      </div>
    );
  },
  actionsRender: (props) => {
    if (props.isMobile) return [];
    return [
      <Tooltip title="清除缓存"><ClearOutlined key="ClearOutlined" onClick={() => {
        Cache.evictAllCaches()
        message.info("清除完毕")
      }} /></Tooltip>,
      <Tooltip title="中文/Engilish"><TranslationOutlined key="TranslationOutlined" /></Tooltip>,
      <Tooltip title="版本"><InfoCircleOutlined key="InfoCircleFilled" /></Tooltip>,
      <Tooltip title="GitHub"><a href="https://github.com/rwsbillyang/RuleEngine" target="_blank"><GithubFilled key="GithubFilled"/></a></Tooltip>,
    ];
  }
}

export const AppRoutes: RouteObject[] = [
  {
    path: '/',
    //element: <MySimpleLayout menuRoutes={menuRoutes} navRoutes={actions}/>,
    element: <MyProLayout {...proLayoutProps} />,
    children: menuRoutes as RouteObject[]  //路由嵌套，子路由的元素需使用<Outlet />
  },
  {
    path: '/login',
    element: lazyLoad(<NoFoundPage />)
  }
]


// const actions: MyRouteObject[] = [
//   {
//     path: '',
//     name: "zn/en",
//     onClick: (e) => {
//       console.log("TODO, switch language")
//     },
//   },
//   {
//     path: '',
//     name: "清空缓存",
//     onClick: (e) => Cache.evictAllCaches()
//   }
// ]

