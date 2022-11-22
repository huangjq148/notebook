import React, { lazy, useEffect } from 'react';
import type { RouteObject } from 'react-router-dom';
import { useLocation, useRoutes, Navigate } from 'react-router-dom';
import BasicLayout from "@/layout"
import LoginPage from "@/pages/Login"
import OverviewPage from "@/pages/Overview"
import OrdersPage from "@/pages/Orders"
import ProductPage from "@/pages/Product"
import ContactPage from "@/pages/Contact"
import StockPage from "@/pages/Stock"
// const AuthWrapper = lazy(() => import('@/layouts/AuthWrapper'));

export default () => {
  const location = useLocation();


  const routes: RouteObject[] = [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: "/",
      element: <BasicLayout />,
      children: [
        {
          path: "overview",
          element: <OverviewPage />
        },
        {
          path: "orders",
          element: <OrdersPage />
        },
        {
          path: "goods",
          element: <ProductPage />
        },
        {
          path: "stock",
          element: <StockPage />
        },
        {
          path: "contact",
          element: <ContactPage />
        }
      ]
    },
    {
      path: '/',
      element: <Navigate to="/login" />,
    },
  ];

  return useRoutes(routes);
};
