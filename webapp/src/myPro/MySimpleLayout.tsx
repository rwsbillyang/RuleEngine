import { Layout, Menu } from 'antd';

import { Link, matchRoutes, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
//import { AppRoutes } from './AppRoutes';
import React from 'react';
import { MyRouteObject } from './MyRouteObject';

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

const routesToMenu = (routes: MyRouteObject[], recusively: boolean = true, keyPreix: string = "") => {
  if (recusively)
    return routes.map((e,i) =>e.hideInMenu ? null: ((e.hideChildrenInMenu != true && e.children && e.children.length > 0) ?
      <SubMenu key={keyPreix+i} title={e.name || e.id || e.path}>
        {routesToMenu(e.children, recusively, keyPreix+i+"-")}
      </SubMenu> : <Menu.Item key={keyPreix+i} icon={e.icon} disabled={e.disabled} title={e.name || e.id || e.path}> <Link to={e.path || '/'} target={e.target}>{e.name || e.id || e.path}</Link></Menu.Item>))
  else
    return routes.map((e,i) => <Menu.Item key={keyPreix+i} icon={e.icon} disabled={e.disabled} title={e.name || e.id || e.path}> <Link to={e.path || '/'}>{e.name || e.id || e.path}</Link></Menu.Item>)
}

const selectedPaths = ( menuRoutes: MyRouteObject[]) => {
    const routes = matchRoutes(menuRoutes, location.pathname); 
    const pathArr: string[] = [];
    if (routes !== null) {
      routes.forEach((item) => {
        const path = item.route.path;
        if (path) {
          pathArr.push(path);
        }
      })
    }
    return pathArr
}

//在AppRoute中的根路由中，作为其component
export const MySimpleLayout: React.FC<{ menuRoutes: MyRouteObject[], navRoutes?: MyRouteObject[] }> = ({ menuRoutes, navRoutes }) => {
  const location = useLocation();
  const [defaultNavSelectedKeys, setDefaultNavSelectedKeys] = useState<string[]>([]);
  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<string[]>([]);
  const [defaultOpenKeys, setDefaultOpenKeys] = useState<string[]>([]);
  const [isInit, setIsInit] = useState<Boolean>(false)

  useEffect(() => {
    const pathArr = selectedPaths(menuRoutes)
    setDefaultSelectedKeys(pathArr);
    setDefaultOpenKeys(pathArr);

    if(navRoutes){
        setDefaultNavSelectedKeys(selectedPaths(navRoutes));
    }
   
    setIsInit(true);
  }, [location.pathname]);

  if (!isInit) {
    return null;
  }

  return (
    <Layout>
      {navRoutes && navRoutes.length > 0 && <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={defaultNavSelectedKeys}>
          {routesToMenu(navRoutes, false,"header")}
        </Menu>
      </Header>}


      <Layout>
        <Sider width={200} className="site-layout-background">
          <Menu
            mode="inline"
            defaultSelectedKeys={defaultSelectedKeys}
            defaultOpenKeys={defaultOpenKeys}
            style={{ height: '100%', borderRight: 0 }}
          >
            {routesToMenu(menuRoutes, true, "menu")}
          </Menu>
        </Sider>

        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 600,
              height: "100%"
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}