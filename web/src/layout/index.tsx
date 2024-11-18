import { UserOutlined } from "@ant-design/icons";
import React, { useState } from "react";

import { DesktopOutlined, FileOutlined, PieChartOutlined } from "@ant-design/icons";
import { Layout, Menu, MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LayoutHeader from "./components/Header";
import styles from "./index.module.less";

const { Sider, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
        <LayoutHeader setCollapsed={setCollapsed} collapsed={collapsed} />
        <Content
          style={{
            padding: "24px 16px",
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
