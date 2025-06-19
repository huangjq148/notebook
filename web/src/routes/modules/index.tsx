import {
  ContactsOutlined,
  DashboardOutlined,
  OrderedListOutlined,
  ProductOutlined,
  StockOutlined,
} from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { flattenMenu, generateMenuKeys } from '../utils';
import lazyLoad from '../utils/lazyLoad';

const menuRoutes: Router[] = [
  {
    path: 'overview',
    label: '概览',
    icon: <DashboardOutlined />,
    element: lazyLoad('@/pages/overview'),
  },
  {
    path: 'orders',
    label: '订单',
    icon: <OrderedListOutlined />,
    element: lazyLoad('@/pages/order'),
  },
  {
    path: 'product',
    label: '商品',
    icon: <ProductOutlined />,
    element: lazyLoad('@/pages/product'),
  },
  {
    path: 'stock',
    label: '库存',
    icon: <StockOutlined />,
    element: lazyLoad('@/pages/stock'),
  },
  {
    path: 'contact',
    label: '联系人',
    icon: <ContactsOutlined />,
    element: lazyLoad('@/pages/contact'),
  },
  {
    path: '/',
    hideInMenu: true,
    element: <Navigate to="/overview" />,
  },
];

export const routeWithKey = generateMenuKeys(flattenMenu(menuRoutes));

export default menuRoutes;
