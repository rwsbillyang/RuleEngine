import React, { useState } from 'react';

import {
    PageContainer,
    ProLayout,
    ProLayoutProps
} from '@ant-design/pro-layout';


import { Link, Outlet } from 'react-router-dom';
import { ProConfigProvider } from '@ant-design/pro-provider';

export interface MyProLayoutProps extends ProLayoutProps{
    dark?: boolean
}

export default (props: MyProLayoutProps) => {

    const [pathname, setPathname] = useState('/');
    //const [sideBarCollapsed, setSideBarCollapsed] = useState(true)

    if (typeof document === 'undefined') {
        return <div />;
    }
    return (
        <ProConfigProvider dark={props.dark}>
            <ProLayout
                {...props}
                location={{ pathname }}
                menuItemRender={(menuItemProps, defaultDom) => {
                    if (menuItemProps.isUrl || !menuItemProps.path) {
                        return defaultDom;
                    }
                    return <div onClick={() => { 
                        setPathname(menuItemProps.path || '/') 
                        //console.log("menu clicked: "+menuItemProps.path)
                        }}>
                        <Link to={menuItemProps.path} target={menuItemProps.target}>{defaultDom}</Link>
                    </div>
                }}
            >
                <PageContainer
                    style={{
                        height: '200vh',
                        minHeight: 800,
                    }}
                >
                    <Outlet />
                </PageContainer>

            </ProLayout>
        </ProConfigProvider>

    );
};
