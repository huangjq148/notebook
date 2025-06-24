import BasicLayout from '@/layout';
import LoginPage from '@/pages/login';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import modules from './modules';
import { generateMenuKeys } from './utils';
import lazyLoad from './utils/lazyLoad';
import { Router } from '@/global';

export const routes: Router[] = [
  {
    path: '/login',
    element: <LoginPage />,
    hideInMenu: true,
  },
  {
    path: '/setting',
    element: <BasicLayout />,
    hideInMenu: true,
    children: [
      {
        path: 'data-transfer',
        element: lazyLoad('@/pages/setting/dataTransfer'),
      },
    ],
  },
  {
    path: '/',
    element: <BasicLayout />,
    children: modules,
  },
  {
    path: '/',
    element: <Navigate to="/login" />,
  },
];

export default createBrowserRouter(generateMenuKeys(routes));
