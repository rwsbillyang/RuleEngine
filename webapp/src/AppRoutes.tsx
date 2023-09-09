import React from 'react'
import {  ReactNode, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import { Home } from './pages/Home'
import { NoFoundPage } from './pages/404'

import { MyRouteObject } from './myPro/MyRouteObject'
import { MySimpleLayout } from './myPro/MySimpleLayout'
import { ParamTable } from './pages/basic/ParamTable'
import { ParamTypeTable } from './pages/basic/ParamTypeTable'
import { OperatorTable } from './pages/basic/OperatorTable'
import { ConstantTable } from './pages/basic/ConstantTable'
import { DomainTable } from './pages/basic/DomainTable'
import { BasicExpressionTable, ComplexExpressionTable} from './pages/basic/ExpressionTable'
import { RuleTable } from './pages/rule/RuleTable'
import { RuleEdit } from './pages/rule/RuleEdit'
import { ActionTable } from './pages/rule/ActionTable'
import { RuleGroupTable } from './pages/rule/RuleGroupTable'
import { ParamCategoryTable } from './pages/basic/ParamCategory'
import { EnableParamCategory } from './Config'



// 实现懒加载的用Suspense包裹 定义函数
const lazyLoad = (children: ReactNode): ReactNode =>{
  return <Suspense fallback={<div>Loading...</div>}>
    {children}
  </Suspense>
}

const menuRoutes: MyRouteObject[] = [
  {
    index: true,
    id: 'Home',
    name: "首页",
    hideInMenu: true,
    element: lazyLoad(<Home />)
  }, 
  {
    path: '/basic',
    id: 'basic',
    name: "基础数据",
    //element: lazyLoad(<Page2 />),//优先级高于children
    children:[
      {
        path: '/basic/domain',
        id: '领域',
        element: lazyLoad(<DomainTable />)
      },
      {
        path: '/basic/type',
        id: '类型',
        element: lazyLoad(<ParamTypeTable />)
      },
      {
        path: '/basic/operator',
        id: "操作符",
        element: lazyLoad(<OperatorTable />)
      },
      {
        path: '/basic/constant',
        id: '常量',
        element: lazyLoad(<ConstantTable />)
      },
      {
        path: '/basic/paramCategory',
        id: '变量分类',
        hideInMenu: !EnableParamCategory,
        element: lazyLoad(<ParamCategoryTable />)
      },
      {
        path: '/basic/param',
        id: '变量',
        element: lazyLoad(<ParamTable />)
      },
      {
        path: '/basic/basicExpression',
        id: '基本逻辑表达式',
        element: lazyLoad(<BasicExpressionTable />)
      },
      {
        path: '/basic/complexExpression',
        id: '复合逻辑表达式',
        element: lazyLoad(<ComplexExpressionTable />)
      },
      // {
      //   path: '/basic/expression/editComplex',
      //   id: '编辑复合表达式',
      //   hideInMenu: true,
      //   element: lazyLoad(<ComplexExpressionEditor />)
      // },
      
    ]
  },
  
  {
    path: '/rule',
    id: 'rule',
    name: "规则",
    children:[
      {
        path: '/rule/action',
        id: '动作',
        element: lazyLoad(<ActionTable />)
      },
      {
        path: '/rule/list',
        id: '规则',
        element: lazyLoad(<RuleTable />)
      },
      {
        path: '/rule/editRule',
        id: '编辑规则',
        hideInMenu: true,
        element: lazyLoad(<RuleEdit />)
      },
      {
        path: '/rule/group',
        id: '规则组',
        element: lazyLoad(<RuleGroupTable />)
      }
    
    ]
  }
]

export const AppRoutes: RouteObject[] =  [
  {
    path: '/',
    element: <MySimpleLayout menuRoutes={menuRoutes}/>,
    //路由嵌套，子路由的元素需使用<Outlet />
    children: menuRoutes
  },

  {
    path: '/login',
    element: lazyLoad(<NoFoundPage />)
  }

]


