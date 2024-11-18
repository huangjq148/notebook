import { ConfigProvider } from "antd";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import Zh from "antd/locale/zh_CN";
import "dayjs/locale/zh-cn";
import { Inspector } from "react-dev-inspector";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ConfigProvider locale={Zh}>
    <Inspector />
    <App />
  </ConfigProvider>,
);
