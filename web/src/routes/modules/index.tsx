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
import { Router } from '@/global';

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
    path: 'speak',
    label: '说',
    icon: <ContactsOutlined />,
    element: lazyLoad('@/pages/speak'),
  },
  {
    path: 'alarm',
    label: '定时提醒',
    icon: <ContactsOutlined />,
    element: lazyLoad('@/pages/alarm'),
  },
  {
    path: 'student-work',
    label: '作业管理',
    icon: <ContactsOutlined />,
    children: [
      {
        path: 'manage',
        flatMenu: true,
        children: [
          {
            path: '',
            label: '作业列表',
            element: lazyLoad('@/pages/studentWork/manage'),
          },
          {
            path: ':id',
            label: '科目作业',
            hideInMenu: true,
            element: lazyLoad('@/pages/studentWork/manage/subjectWork'),
          },
        ],
      },
      {
        path: 'calculator-manage',
        flatMenu: true,
        children: [
          {
            path: 'list',
            label: '计算题',
            element: lazyLoad('@/pages/studentWork/calculatorManage'),
          },
          {
            path: 'create',
            label: '生成计算题',
            hideInMenu: true,
            element: lazyLoad('@/pages/studentWork/generateCalculator'),
          },
          {
            path: ':id',
            label: '计算题编辑',
            hideInMenu: true,
            element: lazyLoad('@/pages/studentWork/generateCalculator'),
          },
        ],
      },
    ],
  },
  {
    path: '/',
    hideInMenu: true,
    element: <Navigate to="/overview" />,
  },
];

export const routeWithKey = flattenMenu(generateMenuKeys(menuRoutes));

export default menuRoutes;
