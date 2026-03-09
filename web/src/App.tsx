import { ConfigProvider, theme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import router from '@/routes';
import './App.css';

// Ant Design 主题配置 - 使用蓝色系设计系统颜色
const antdTheme = {
  token: {
    // 主色调 - 蓝色系
    colorPrimary: '#2563EB',
    colorPrimaryHover: '#3B82F6',
    colorPrimaryActive: '#1D4ED8',
    
    // 成功色
    colorSuccess: '#10B981',
    colorSuccessBg: '#D1FAE5',
    
    // 警告色
    colorWarning: '#F59E0B',
    colorWarningBg: '#FEF3C7',
    
    // 错误色
    colorError: '#EF4444',
    colorErrorBg: '#FEE2E2',
    
    // 信息色
    colorInfo: '#0EA5E9',
    colorInfoBg: '#E0F2FE',
    
    // 文字色
    colorText: '#1E293B',
    colorTextSecondary: '#475569',
    colorTextTertiary: '#64748B',
    colorTextQuaternary: '#94A3B8',
    
    // 背景色
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#F8FAFC',
    colorBgSpotlight: '#2563EB',
    
    // 边框色
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#F1F5F9',
    
    // 边框圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // 字体
    fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyCode: "'Fira Code', monospace",
    
    // 字体大小
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    
    // 间距
    paddingXS: 4,
    paddingSM: 8,
    padding: 16,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,
    
    // 控制组件高度
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
    
    // 阴影
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)',
    boxShadowSecondary: '0 8px 24px rgba(37, 99, 235, 0.15)',
    boxShadowTertiary: '0 1px 2px rgba(37, 99, 235, 0.05)',
  },
  components: {
    // 按钮样式
    Button: {
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 4,
      paddingInline: 16,
      paddingInlineLG: 24,
      paddingInlineSM: 12,
      contentFontSize: 14,
      contentFontSizeLG: 16,
      contentFontSizeSM: 12,
      fontWeight: 500,
    },
    // 卡片样式
    Card: {
      borderRadius: 12,
      borderRadiusLG: 16,
      paddingLG: 24,
      padding: 16,
    },
    // 输入框样式
    Input: {
      borderRadius: 8,
      paddingInline: 12,
      paddingBlock: 8,
      colorBorder: '#E2E8F0',
      hoverBorderColor: '#3B82F6',
      activeBorderColor: '#2563EB',
    },
    // 选择器样式
    Select: {
      borderRadius: 8,
      borderRadiusLG: 12,
    },
    // 表格样式
    Table: {
      borderRadius: 12,
      headerBg: '#EFF6FF',
      headerColor: '#1E293B',
      rowHoverBg: '#F8FAFC',
      headerBorderRadius: 8,
      padding: 12,
      paddingXS: 8,
      paddingSM: 8,
    },
    // 菜单样式
    Menu: {
      borderRadius: 8,
      borderRadiusLG: 12,
      itemBg: 'transparent',
      itemSelectedBg: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      itemSelectedColor: '#FFFFFF',
      itemHoverBg: '#EFF6FF',
      itemHoverColor: '#2563EB',
      itemActiveBg: '#DBEAFE',
      subMenuItemBg: 'transparent',
      subMenuItemSelectedBg: '#EFF6FF',
    },
    // 布局样式
    Layout: {
      bodyBg: '#F8FAFC',
      headerBg: '#FFFFFF',
      headerPadding: '0 24px',
      headerHeight: 64,
      siderBg: '#FFFFFF',
      triggerBg: '#FFFFFF',
      triggerColor: '#1E293B',
    },
    // 分页样式
    Pagination: {
      borderRadius: 8,
      itemActiveBg: '#2563EB',
      itemActiveColor: '#FFFFFF',
      itemBg: '#FFFFFF',
      itemInputBg: '#FFFFFF',
    },
    // 标签页样式
    Tabs: {
      borderRadius: 8,
      colorBorderSecondary: '#E2E8F0',
      itemActiveColor: '#2563EB',
      itemHoverColor: '#3B82F6',
      itemSelectedColor: '#2563EB',
      inkBarColor: '#2563EB',
    },
    // 弹窗样式
    Modal: {
      borderRadius: 16,
      contentBg: '#FFFFFF',
      headerBg: '#FFFFFF',
    },
    // 抽屉样式
    Drawer: {
      borderRadius: 16,
      contentBg: '#FFFFFF',
      headerBg: '#FFFFFF',
    },
    // 标签样式
    Tag: {
      borderRadius: 4,
      defaultBg: '#EFF6FF',
      defaultColor: '#2563EB',
    },
    // 徽章样式
    Badge: {
      colorError: '#F97316',
      colorErrorBg: '#F97316',
    },
    // 日期选择器
    DatePicker: {
      borderRadius: 8,
      colorBorder: '#E2E8F0',
    },
    // 表单
    Form: {
      labelColor: '#1E293B',
      labelFontSize: 14,
      labelRequiredMarkColor: '#F97316',
    },
    // 消息提示
    Message: {
      borderRadius: 8,
      contentBg: '#FFFFFF',
    },
    // 通知
    Notification: {
      borderRadius: 12,
    },
  },
  algorithm: theme.defaultAlgorithm,
};

function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
