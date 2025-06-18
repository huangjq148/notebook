import { Card } from "@/components";
import { Tabs } from "antd";
import Order from "./components/Order";
import Stock from "./components/Stock";

const DataTransfer = () => {
  return (
    <Card>
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            label: `订单`,
            key: "1",
            children: <Order />,
          },
          {
            label: `库存`,
            key: "2",
            children: <Stock />,
          },
        ]}
      />
    </Card>
  );
};

export default DataTransfer;
