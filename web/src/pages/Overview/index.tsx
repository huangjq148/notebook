import { SearchForm, DateRangePicker } from "@/components";
import { getTop5Data } from "@/services/overview";
import { Button, DatePicker, Form, List } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styles from "./index.module.less";
import Charts from "./charts";

type TopData = {
  name: string;
  money: string;
};

export default () => {
  const [topData, setTopData] = useState<any>([]);

  const loadTopData = async (conditions?: Record<string, any>) => {
    const result = (await getTop5Data(conditions)) as any;

    const newData = [
      {
        label: "购买最多的产品",
        data: result.top5BuyGoods || [],
      },
      {
        label: "卖的最多的产品",
        data: result.top5SellGoods || [],
      },
      {
        label: "利润最高的产品",
        data: result.top5ProfitGoods || [],
      },
      {
        label: "利润最多的客户",
        data: result.top5BuyCustomer || [],
      },
    ];
    setTopData(newData);
  };

  useEffect(() => {
    loadTopData();
  }, []);

  const handleFormSearch = (values: any) => {
    let conditions = {};

    if (values.orderTime?.length) {
      conditions = {
        startOrderTime: dayjs(values.orderTime[0]).format("YYYY-MM-DD"),
        endOrderTime: dayjs(values.orderTime[1]).format("YYYY-MM-DD"),
      };
    }

    loadTopData(conditions);
  };

  return (
    <div>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="日期" name="orderTime">
            <DateRangePicker />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" type="primary">
              查询
            </Button>
          </Form.Item>
        </Form>
      </SearchForm>

      <div className={styles.topListWrapper}>
        {topData.map((topDataItem: any) => (
          <List
            className={styles.listDataContainer}
            key={topDataItem.label}
            header={<div>{topDataItem.label}</div>}
            bordered
            dataSource={topDataItem.data ?? []}
            renderItem={(item: TopData) => (
              <List.Item>
                <>
                  <span>{item.name}</span>
                  <span>{parseFloat(item.money).toFixed(2)}</span>
                </>
              </List.Item>
            )}
          />
        ))}
      </div>
      <SearchForm style={{ height: "400px", width: "100%", marginTop: "16px" }}>
        <Charts />
      </SearchForm>
    </div>
  );
};
