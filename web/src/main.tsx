import { ConfigProvider } from 'antd'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import Zh from "antd/locale/zh_CN"
import 'dayjs/locale/zh-cn';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider locale={Zh}>
    <App />
  </ConfigProvider>
)
