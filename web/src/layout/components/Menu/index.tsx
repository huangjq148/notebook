import { Menu } from 'antd';
import { routeWithKey } from '@/routes/modules';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import type { MenuProps } from 'antd';
import { useUser } from '@/store';

const SiderMenu = () => {
  const navigate = useNavigate();
  // 角色变化时菜单要跟着变（例如切换账号后），因此依赖 roles 而不是空依赖
  const roles = useUser((state) => state.roles);

  const handleMenuItemClick = (val: { key: string }) => {
    navigate(val.key);
  };

  // 将路由数据转换为 Menu 组件能接受的 items 格式
  const menuItems: MenuProps['items'] = useMemo(() => {
    // 没有 roles 声明的菜单项对所有登录用户可见；声明了则需命中其一
    const visibleRoutes = routeWithKey.filter(
      (route) => !route.roles?.length || route.roles.some((role) => roles.includes(role)),
    );

    return visibleRoutes.map((route) => ({
      key: route.key || route.path || '',
      label: route.label,
      icon: route.icon,
      children: route.children?.map((child: any) => ({
        key: child.key || child.path || '',
        label: child.label,
        icon: child.icon,
      })),
    }));
  }, [roles]);

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
