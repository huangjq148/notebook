import { Card, SearchForm } from '@/components';
import { useTable } from '@/hooks';
import { queryStock } from '@/services/stock';
import { Button, Form, Input, message, Space, Table } from 'antd';
import { useState } from 'react';
import TargetUserSelectModal from './TargetUserSelectModal';

const Stock = () => {
  const [conditions, setConditions] = useState({});
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [open, setOpen] = useState(false);
  const { dataSource, loading, pagination, searchForm, handlePageChange } = useTable<Product>({
    request: queryStock,
    conditions,
  });

  const columns = [
    {
      title: '产品名',
      dataIndex: 'name',
    },
    {
      title: '进价',
      dataIndex: 'buyPrice',
    },
    {
      title: '售价',
      dataIndex: 'sellPrice',
    },
    {
      title: '库存',
      dataIndex: 'number',
    },
  ];

  const handleFormSearch = (values: any) => {
    setConditions(values);
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedKeys(selectedRowKeys);
    },
  };

  const handleTransferData = async () => {
    searchForm();
    message.success('数据移交成功');
    setSelectedKeys([]);
    setOpen(false);
  };

  return (
    <Card>
      <TargetUserSelectModal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleTransferData}
        dataIds={selectedKeys}
        type="stock"
      />
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="品名" name="name">
            <Input allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button htmlType="submit" type="primary">
                查询
              </Button>
              <Button onClick={() => setOpen(true)}>数据移交</Button>
            </Space>
          </Form.Item>
        </Form>
      </SearchForm>

      <Table
        rowSelection={{
          type: 'checkbox',
          ...rowSelection,
        }}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handlePageChange}
        dataSource={dataSource}
        columns={columns}
      />
    </Card>
  );
};

export default Stock;
