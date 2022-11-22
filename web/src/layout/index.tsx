import { useUser } from '@/store';
import {
    DesktopOutlined,
    FileOutlined, PieChartOutlined, UserOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu } from "antd";
import { useEffect } from 'react';
import { useNavigate, Outlet } from "react-router-dom";
import styles from "./index.module.less";

const { Header, Sider, Content } = Layout;

export default () => {
    const navigate = useNavigate()
    const {
        userInfo,
        getUserInfo
    } = useUser(state => ({
        getUserInfo: state.getUserInfo,
        userInfo: state.userInfo
    }))

    const handleMenuItemClick = (key: string) => {
        navigate(key)
    }

    const items: MenuProps['items'] = [
        {
            key: '/overview',
            icon: <PieChartOutlined />,
            label: '概览',
        },
        {
            key: '/orders',
            icon: <DesktopOutlined />,
            label: '订单',
        },
        {
            key: '/stock',
            icon: <FileOutlined />,
            label: '库存',
        },
        {
            key: '/goods',
            icon: <FileOutlined />,
            label: '商品',
        },
        {
            key: '/contact',
            icon: <UserOutlined />,
            label: '联系人',
        },
    ]

    useEffect(() => {
        getUserInfo()
    }, [])

    return <Layout style={{ width: "100vw", height: "100vh" }}>
        <Header className={styles.header}>
            <div className={styles.logo} >Recorder</div>
            <div className={styles.action}>{userInfo.Name} </div>
        </Header>
        <Layout>
            <Sider width={200} className="site-layout-background">
                <Menu
                    mode="inline"
                    style={{ height: '100%', borderRight: 0 }}
                    key={"key"}
                    items={items}
                    onClick={(val: { key: string }) => {
                        navigate(val.key)
                    }}
                />
            </Sider>
            <Layout style={{ padding: '0 24px 24px' }}>
                <Content
                    className="site-layout-background"
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    </Layout>
}