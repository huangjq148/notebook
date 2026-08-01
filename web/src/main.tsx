import { ConfigProvider } from 'antd';
import ReactDOM from 'react-dom/client';
import dayjs from 'dayjs';
import App from './App';
import './index.css';
import Zh from 'antd/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');
import { Inspector } from 'react-dev-inspector';
// https://ant-design.antgroup.com/docs/react/v5-for-19-cn
import '@ant-design/v5-patch-for-react-19'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider locale={Zh}>
    <Inspector />
    <App />
  </ConfigProvider>,
);
