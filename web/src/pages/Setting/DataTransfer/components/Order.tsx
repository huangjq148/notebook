import { DateRangePicker, SearchForm } from "@/components";
import { useTable } from "@/hooks";
import { queryOrder } from "@/services/order";
import { Button, Form, Input, Modal, Select, Space, Table } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { fetchUserList } from "@/services/user";

const Order = () => {
  const [conditions, setConditions] = useState({});
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<{}[]>([]);
  const { dataSource, loading, searchForm, pagination, handlePageChange } = useTable<Order>({
    request: queryOrder,
    conditions,
  });
  const columns = [
    {
      title: "产品名",
      dataIndex: "name",
      width: 100,
    },
    {
      title: "姓名",
      dataIndex: "contact",
    },
    {
      title: "进价",
      dataIndex: "buyPrice",
    },
    {
      title: "售价",
      dataIndex: "sellPrice",
    },
    {
      title: "数量",
      dataIndex: "number",
    },
    {
      title: "其他费用",
      dataIndex: "otherCost",
      render: (text: number) => text || "-",
    },
    {
      title: "利润",
      dataIndex: "number",
      render: (text: string, record: any) => {
        return (
          <>
            {parseFloat(
              `${record.sellPrice * record.number - record.buyPrice * record.number - record.otherCost}`,
            ).toFixed(2)}
          </>
        );
      },
    },
    {
      title: "日期",
      dataIndex: "orderTime",
      width: 140,
      render: (text: string, record: Order) => dayjs(text || record.createTime).format("YYYY-MM-DD"),
    },
  ];

  const handleFormSearch = (values: any) => {
    const { createTime, ...restValues } = values;
    let newConditions = restValues;

    if (createTime) {
      newConditions = {
        ...restValues,
        startCreateDate: dayjs(createTime[0]).format("YYYY-MM-DD"),
        endCreateDate: dayjs(createTime[1]).format("YYYY-MM-DD"),
      };
    }

    setConditions(newConditions);
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Order[]) => {
      setSelectedKeys(selectedRowKeys);
    },
  };

  const transferData = () => {
    console.log(selectedKeys);
    setOpen(true);
    // searchForm();
  };

  useEffect(() => {
    fetchUserList().then((res) => {
      setUsers(res.map((item) => ({ value: item.id, label: item.name })));
    });
  }, []);

  return (
    <div>
      <Modal open={open} title="数据移交" onCancel={() => setOpen(false)}>
        数据移交给：<Select style={{ width: 200 }} options={users}></Select>
      </Modal>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="品名" name="name">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="姓名" name="contact">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="日期" name="createTime">
            <DateRangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button htmlType="submit" type="primary" loading={loading}>
                查询
              </Button>
              <Button onClick={transferData}>数据移交</Button>
            </Space>
          </Form.Item>
        </Form>
      </SearchForm>
      <Table
        rowSelection={{
          type: "checkbox",
          ...rowSelection,
        }}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handlePageChange}
        dataSource={dataSource}
        columns={columns}
      />
    </div>
  );
};

export default Order;
