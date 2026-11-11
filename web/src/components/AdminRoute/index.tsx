import { useUser } from '@/store';
import { Button, Result } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

/**
 * 管理员路由守卫
 *
 * 非 admin 直接访问受限页面时展示 403 提示页（而不是白屏）。
 * 角色来自 zustand（登录成功写入、刷新时从 localStorage 恢复），
 * 后端接口另有 AdminOnly 中间件做真正的鉴权，这里只是前端体验层。
 */
const AdminRoute = ({ children }: Props) => {
  const navigate = useNavigate();
  const roles = useUser((state) => state.roles);

  if (!roles.includes('admin')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="没有权限访问该页面，请使用管理员账号登录。"
        extra={
          <Button type="primary" onClick={() => navigate('/overview')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
