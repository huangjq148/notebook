import {
    MenuFoldOutlined,
    MenuUnfoldOutlined, UserOutlined
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";

import { useUser } from "@/store";
import { DesktopOutlined, FileOutlined, PieChartOutlined } from "@ant-design/icons";
import { Dropdown, Layout, Menu, MenuProps, Space, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./index.module.less";

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { userInfo, getUserInfo, logout } = useUser((state) => ({
    getUserInfo: state.getUserInfo,
    userInfo: state.userInfo,
    logout: state.logout,
  }));

  const handleMenuItemClick = (val: { key: string }) => {
    navigate(val.key);
  };

  const items: MenuProps["items"] = [
    {
      key: "/overview",
      icon: <PieChartOutlined />,
      label: "概览",
    },
    {
      key: "/orders",
      icon: <DesktopOutlined />,
      label: "订单",
    },
    {
      key: "/stock",
      icon: <FileOutlined />,
      label: "库存",
    },
    {
      key: "/goods",
      icon: <FileOutlined />,
      label: "商品",
    },
    {
      key: "/contact",
      icon: <UserOutlined />,
      label: "联系人",
    },
  ];

  const UserInfo = () => {
    const items = [
      { label: "设置", key: "setting" }, // 菜单项务必填写 key
      { label: <span onClick={logout}>退出</span>, key: "logout" },
    ];
    return (
      <Dropdown menu={{ items }}>
        <Space>
          <UserOutlined />
          <span className={styles.userInfo}>{userInfo.name ?? "-"} </span>
        </Space>
      </Dropdown>
    );
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  return (
    <Layout style={{ width: "100vw", height: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className={styles.logo}>账簿</div>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[location.pathname]}
          onClick={handleMenuItemClick}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className={styles.header} style={{ padding: "0 16px", background: colorBgContainer }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: styles.trigger,
            onClick: () => setCollapsed(!collapsed),
          })}
          <div className={styles.action}>
            <UserInfo />
          </div>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
