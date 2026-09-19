import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { proxy } from './proxy';

function pathResolve(dir: string) {
  return resolve(__dirname, '.', dir);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 与后端同域部署在根路径，使用绝对路径避免深层路由刷新时资源 404
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('/@ant-design/icons') || id.includes('/@ant-design/icons-svg')) {
            return 'vendor-icons';
          }

          if (
            id.includes('/react/') ||
            id.includes('/react@') ||
            id.includes('/react-dom/') ||
            id.includes('/react-dom@') ||
            id.includes('/react-router-dom/') ||
            id.includes('/react-router-dom@') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }

          if (id.includes('/zrender/') || id.includes('/zrender@') || id.includes('/node_modules/zrender')) {
            return 'vendor-zrender';
          }

          if (id.includes('/echarts/lib/chart/') || id.includes('/echarts/charts')) {
            return 'vendor-echarts-charts';
          }

          if (id.includes('/echarts/lib/component/') || id.includes('/echarts/components')) {
            return 'vendor-echarts-components';
          }

          if (id.includes('/echarts/') || id.includes('/echarts@')) {
            return 'vendor-echarts-core';
          }

          if (
            id.includes('/@ant-design/cssinjs') ||
            id.includes('/@ant-design+cssinjs') ||
            id.includes('/@emotion/') ||
            id.includes('/@emotion+') ||
            id.includes('/stylis/') ||
            id.includes('/stylis@') ||
            id.includes('/antd/es/style/') ||
            id.includes('/antd/es/theme/') ||
            id.includes('/antd/es/config-provider/')
          ) {
            return 'vendor-antd-style';
          }

          if (
            id.includes('/antd/es/_util/') ||
            id.includes('/@rc-component/util') ||
            id.includes('/@rc-component+util') ||
            id.includes('/rc-util')
          ) {
            return 'vendor-antd-util';
          }

          if (
            id.includes('/@rc-component/motion') ||
            id.includes('/@rc-component+motion') ||
            id.includes('/@rc-component/resize-observer') ||
            id.includes('/@rc-component+resize-observer') ||
            id.includes('/@rc-component/overflow') ||
            id.includes('/@rc-component+overflow') ||
            id.includes('/@rc-component/virtual-list') ||
            id.includes('/@rc-component+virtual-list') ||
            id.includes('/rc-motion') ||
            id.includes('/rc-resize-observer') ||
            id.includes('/rc-overflow') ||
            id.includes('/rc-virtual-list')
          ) {
            return 'vendor-antd-motion';
          }

          if (
            id.includes('/antd/es/button/') ||
            id.includes('/antd/es/card/') ||
            id.includes('/antd/es/descriptions/') ||
            id.includes('/antd/es/empty/') ||
            id.includes('/antd/es/float-button/') ||
            id.includes('/antd/es/layout/') ||
            id.includes('/antd/es/list/') ||
            id.includes('/antd/es/menu/') ||
            id.includes('/antd/es/space/') ||
            id.includes('/antd/es/spin/') ||
            id.includes('/antd/es/statistic/') ||
            id.includes('/antd/es/switch/') ||
            id.includes('/antd/es/tabs/') ||
            id.includes('/antd/es/tag/') ||
            id.includes('/antd/es/upload/') ||
            id.includes('/@rc-component/menu') ||
            id.includes('/@rc-component+menu') ||
            id.includes('/@rc-component/tabs') ||
            id.includes('/@rc-component+tabs') ||
            id.includes('/@rc-component/upload') ||
            id.includes('/@rc-component+upload') ||
            id.includes('/rc-menu') ||
            id.includes('/rc-switch') ||
            id.includes('/rc-tabs') ||
            id.includes('/rc-upload')
          ) {
            return 'vendor-antd-widgets';
          }

          if (
            id.includes('/antd/es/date-picker/') ||
            id.includes('/antd/es/time-picker/') ||
            id.includes('/antd/es/calendar/') ||
            id.includes('/antd/es/locale/') ||
            id.includes('/@rc-component/picker') ||
            id.includes('/rc-picker')
          ) {
            return 'vendor-antd-picker';
          }

          if (
            id.includes('/antd/es/table/') ||
            id.includes('/antd/es/pagination/') ||
            id.includes('/@rc-component/table') ||
            id.includes('/rc-table') ||
            id.includes('/rc-pagination')
          ) {
            return 'vendor-antd-table';
          }

          if (
            id.includes('/antd/es/select/') ||
            id.includes('/antd/es/auto-complete/') ||
            id.includes('/antd/es/tree-select/') ||
            id.includes('/antd/es/tree/') ||
            id.includes('/antd/es/transfer/') ||
            id.includes('/@rc-component/select') ||
            id.includes('/@rc-component/tree') ||
            id.includes('/rc-select') ||
            id.includes('/rc-tree')
          ) {
            return 'vendor-antd-select';
          }

          if (
            id.includes('/antd/es/form/') ||
            id.includes('/antd/es/input') ||
            id.includes('/antd/es/checkbox/') ||
            id.includes('/antd/es/radio/') ||
            id.includes('/@rc-component/form') ||
            id.includes('/@rc-component/input') ||
            id.includes('/rc-field-form') ||
            id.includes('/rc-input')
          ) {
            return 'vendor-antd-form';
          }

          if (
            id.includes('/antd/es/modal/') ||
            id.includes('/antd/es/drawer/') ||
            id.includes('/antd/es/dropdown/') ||
            id.includes('/antd/es/popconfirm/') ||
            id.includes('/antd/es/popover/') ||
            id.includes('/antd/es/tooltip/') ||
            id.includes('/antd/es/message/') ||
            id.includes('/antd/es/notification/') ||
            id.includes('/@rc-component/dialog') ||
            id.includes('/@rc-component/drawer') ||
            id.includes('/@rc-component/dropdown') ||
            id.includes('/@rc-component/trigger') ||
            id.includes('/rc-dialog') ||
            id.includes('/rc-drawer') ||
            id.includes('/rc-dropdown') ||
            id.includes('/rc-tooltip')
          ) {
            return 'vendor-antd-overlay';
          }

          if (
            id.includes('/antd/') ||
            id.includes('/antd@') ||
            id.includes('/@ant-design/') ||
            id.includes('/@rc-component/') ||
            id.includes('/rc-')
          ) {
            return 'vendor-antd-core';
          }

          if (
            id.includes('/axios/') ||
            id.includes('/dayjs/') ||
            id.includes('/decimal.js/') ||
            id.includes('/lodash-es/') ||
            id.includes('/pinyin-pro/') ||
            id.includes('/zustand/')
          ) {
            return 'vendor-utils';
          }

          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: pathResolve('node_modules') + '/',
      },
      {
        // /@/xxxx  =>  src/xxx
        find: /@\//,
        replacement: pathResolve('src') + '/',
      },
    ],
  },
  server: {
    port: 8001,
    host: true,
    proxy,
  },
});
