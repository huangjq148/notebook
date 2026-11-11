import { Result } from 'antd';
import { ReactNode } from 'react';
import { useUser } from '@/store';

type AdminRouteProps = {
  children: ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const roles = useUser((state) => state.roles);

  if (!roles.includes('admin')) {
    return <Result status="403" title="403" subTitle="没有权限" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
