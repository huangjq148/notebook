import { SearchForm, TableColumnType } from '@/components';
import { useTable } from '@/hooks';
import { getStudentWorkList } from '@/services/studentWork';
import { Button, Card, Form, Input, Space, Table } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CalculatorManage = () => {
  const [form] = Form.useForm();
  const [conditions, setConditions] = useState({});
  const { tableOptions, searchForm } = useTable({
    request: getStudentWorkList,
    conditions,
  });
  const navigate = useNavigate();

  const columns: TableColumnType[] = [
    { title: 'ID', dataIndex: 'id' },
    {
      title: '操作',
      dataIndex: 'id',
      render: (id: number) => {
        return (
          <Button
            type="primary"
            onClick={() => {
              navigate(`/student-work/calculator-manage/${id}`);
            }}
          >
            详情
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <SearchForm>
        <Space>
          <Input
            placeholder="请输入ID"
            onChange={(event) => {
              setConditions({ name: event.target.value });
            }}
          />
          <Button type="primary" onClick={() => searchForm()}>
            查询
          </Button>
          <Button
            type="primary"
            onClick={() => {
              navigate('/student-work/calculator-manage/create');
            }}
          >
            新建
          </Button>
        </Space>
      </SearchForm>
      <Card>
        <Table rowKey="id" columns={columns} {...tableOptions} />
      </Card>
    </>
  );
};

export default CalculatorManage;
