import { Menu } from 'antd';
import { routeWithKey } from '@/routes/modules';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import type { MenuProps } from 'antd';

const SiderMenu = () => {
  const navigate = useNavigate();

  const handleMenuItemClick = (val: { key: string }) => {
    navigate(val.key);
  };

  // 将路由数据转换为 Menu 组件能接受的 items 格式
  const menuItems: MenuProps['items'] = useMemo(() => {
    return routeWithKey.map((route) => ({
      key: route.key || route.path || '',
      label: route.label,
      icon: route.icon,
      children: route.children?.map((child: any) => ({
        key: child.key || child.path || '',
        label: child.label,
        icon: child.icon,
      })),
    }));
  }, []);

  return (
    <Menu
      theme="light"
      mode="inline"
      items={menuItems}
      selectedKeys={[location.pathname]}
      onClick={handleMenuItemClick}
    />
  );
};

export default SiderMenu;
