import { SearchForm, TableColumnType, TextButton } from '@/components';
import { useTable } from '@/hooks';
import { getCalculatorList, deleteCalculator } from '@/services/calculator';
import { Button, Card, Input, message, Space } from 'antd';
import { Table } from '@/components';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CalculatorManage = () => {
  const [conditions, setConditions] = useState({});
  const { tableOptions, searchForm } = useTable({
    request: getCalculatorList,
    conditions,
  });
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    await deleteCalculator(id);
    message.success('删除成功');
    searchForm();
  };

  const columns: TableColumnType[] = [
    { title: 'ID', dataIndex: 'id' },
    { title: '创建日期', dataIndex: 'createTime', dataType: 'date' },
    {
      title: '操作',
      dataIndex: 'id',
      render: (id: number) => {
        return (
          <Space>
            <TextButton onClick={() => navigate(`/student-work/calculator-manage/${id}`)}>详情</TextButton>
            <TextButton danger onClick={() => handleDelete(id)}>
              删除
            </TextButton>
          </Space>
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
              setConditions({ id: event.target.value });
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
