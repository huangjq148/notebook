import { UserOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

import { DesktopOutlined, FileOutlined, PieChartOutlined } from '@ant-design/icons';
import { Layout, Menu, MenuProps, Watermark } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LayoutHeader from './components/Header';
import styles from './index.module.less';

import SideMenu from './components/Menu';
import { useUser } from '@/store';

const { Sider, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { userInfo } = useUser((state) => ({
    userInfo: state.userInfo,
  }));

  return (
    <Layout
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <Sider theme="light" trigger={null} collapsible collapsed={collapsed}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          账簿
        </div>
        <SideMenu />
      </Sider>
      <Layout className="site-layout">
        <LayoutHeader setCollapsed={setCollapsed} collapsed={collapsed} />
        <Content
          style={{
            padding: '24px 16px',
            overflow: 'auto',
          }}
        >
          <Watermark
            content={`${userInfo.name}(${userInfo.username})`}
            style={{
              height: '100%',
            }}
          >
            <Outlet />
          </Watermark>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
