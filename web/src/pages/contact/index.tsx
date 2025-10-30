import { SearchForm, TextButton, DeleteConfirmButton, Table, TableColumnType } from '@/components';
import { useTable } from '@/hooks';
import { deleteContact, queryContact } from '@/services/contact';
import { Button, Form, Input, message, Modal, Space } from 'antd';
import { useState } from 'react';
import EditPage from './Edit';
import styles from './index.module.less';
import { Contact } from '@/global';

export default () => {
  const [conditions, setConditions] = useState({});
  const { tableOptions, searchForm } = useTable({
    request: queryContact,
    conditions,
  });
  const [modalOptions, setModalOptions] = useState({
    id: '',
    open: false,
  });

  const handleContactDelete = async (id: string) => {
    await deleteContact(id);
    message.success('删除成功');
    searchForm();
  };

  const columns: TableColumnType[] = [
    {
      title: '姓名',
      dataIndex: 'realname',
    },
    {
      title: '电话',
      dataIndex: 'phone',
    },
    {
      title: '地址',
      dataIndex: 'address',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      dataType: 'date',
    },
    {
      title: '操作',
      dataIndex: 'id',
      width: '140px',
      render: (id: string) => (
        <Space size="middle">
          <TextButton onClick={() => handleEditClick(id)}>编辑</TextButton>
          {/* <DeleteConfirmButton onConfirm={() => handleContactDelete(record.id as string)}> */}
          <TextButton danger onClick={() => handleContactDelete(id)}>
            删除
          </TextButton>
          {/* </DeleteConfirmButton> */}
        </Space>
      ),
    },
  ];

  const handleFormSearch = (values: any) => {
    setConditions(values);
  };

  const handleAfterCreate = () => {
    setModalOptions({
      id: '',
      open: false,
    });
    searchForm();
  };

  const handleEditClick = (id: string) => {
    setModalOptions({
      id,
      open: true,
    });
  };

  return (
    <div>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="姓名" name="realname">
            <Input allowClear placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input allowClear placeholder="联系人电话" />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input allowClear placeholder="联系人地址" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button htmlType="submit" type="primary">
                查询
              </Button>
              <Button
                onClick={() => {
                  setModalOptions({
                    id: '',
                    open: true,
                  });
                }}
              >
                新增
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SearchForm>
      <div className={styles.tableWrapper}>
        <Table rowKey="id" {...tableOptions} columns={columns} />
      </div>

      <Modal
        destroyOnClose
        footer={null}
        title={modalOptions.id ? '编辑' : '新增'}
        open={modalOptions.open}
        onCancel={() =>
          setModalOptions({
            id: '',
            open: false,
          })
        }
      >
        <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
      </Modal>
    </div>
  );
};
