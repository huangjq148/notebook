import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Dropdown, List, Modal, Space, Tag, theme } from "antd";
import { Header } from "antd/es/layout/layout";
import React, { useEffect, useState } from "react";
import styles from "./index.module.less";
import { useUser } from "@/store";
import { useNavigate } from "react-router-dom";
import { getTokenList } from "@/utils";
import { setToken, deleteCatchToken } from "@/utils";

const LayoutHeader = (props: { collapsed: boolean; setCollapsed: Function }) => {
  const { collapsed, setCollapsed } = props;
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { userInfo, getUserInfo, logout } = useUser((state) => ({
    getUserInfo: state.getUserInfo,
    userInfo: state.userInfo,
    logout: state.logout,
  }));
  const [tokenList, setTokenList] = useState([]);
  const [selectedUser, setSelectUser] = useState({ username: "", token: "" });
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  const loadTokenList = () => {
    const tokenListCatch = getTokenList();
    setTokenList(tokenListCatch);
  };

  const openSwitchModal = () => {
    loadTokenList();
    setSwitchModalOpen(true);
  };

  const closeSwitchModal = () => {
    setSelectUser({ username: "", token: "" });
    setSwitchModalOpen(false);
  };

  const handleSwitchAccount = () => {
    setToken({ access_token: selectedUser.token }, selectedUser.username);
    window.location.reload();
  };

  const handleDeleteTokenCatch = (e: any, username: string) => {
    e.stopPropagation();
    e.preventDefault();
    deleteCatchToken(username);
    loadTokenList();
  };

  const UserInfo = () => {
    const items = [
      {
        label: (
          <span
            onClick={() => {
              navigate("/setting/data-transfer");
            }}
          >
            数据转移
          </span>
        ),
        key: "dataTransfer",
      }, // 菜单项务必填写 key
      // { label: "设置", key: "setting" }, // 菜单项务必填写 key
      { label: <div onClick={openSwitchModal}>切换账号</div>, key: "switch-account" },
      { label: <div onClick={logout}>退出</div>, key: "logout" },
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
    <Header className={styles.header} style={{ padding: "0 16px", background: colorBgContainer }}>
      <Modal
        title="切换用户"
        open={switchModalOpen}
        onOk={() => handleSwitchAccount()}
        onCancel={closeSwitchModal}
        okButtonProps={{ disabled: !selectedUser.username }}
      >
        <List bordered header={`已选中用户： ${selectedUser.username ? selectedUser.username : "-"}`}>
          {tokenList.map((item: { username: string; token: string }) => (
            <List.Item
              key={item.username}
              onClick={() => {
                item.username !== userInfo.username && setSelectUser(item);
              }}
              actions={[
                <span className={styles.deleteButton} onClick={(e) => handleDeleteTokenCatch(e, item.username)}>
                  删除
                </span>,
              ]}
            >
              {item.username} {userInfo.username === item.username ? <Tag>当前账号</Tag> : null}
            </List.Item>
          ))}
        </List>
      </Modal>
      {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
        className: styles.trigger,
        onClick: () => setCollapsed(!collapsed),
      })}
      <div className={styles.action}>
        <UserInfo />
      </div>
    </Header>
  );
};

export default LayoutHeader;
