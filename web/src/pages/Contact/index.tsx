import { SearchForm, TextButton } from "@/components";
import { useTable } from "@/hooks";
import { deleteContact, queryContact } from "@/services/contact";
import { Button, Form, Input, message, Modal, Space, Table } from "antd";
import { useState } from "react";
import EditPage from "./Edit";
import styles from "./index.module.less";

export default () => {
  const [conditions, setConditions] = useState({});
  const { dataSource, loading, searchForm, pagination, handlePageChange } = useTable<Contact>({
    request: queryContact,
    conditions,
  });
  const [modalOptions, setModalOptions] = useState({ id: "", open: false });

  const handleContactDelete = async (id: string) => {
    await deleteContact(id);
    message.success("删除成功");
    searchForm();
  };

  const columns = [
    {
      title: "姓名",
      dataIndex: "name",
    },
    {
      title: "电话",
      dataIndex: "phone",
    },
    {
      title: "地址",
      dataIndex: "address",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
    },
    {
      title: "操作",
      key: "operation",
      width: "140px",
      render: (record: Contact) => (
        <Space size="middle">
          <TextButton onClick={() => handleEditClick(record.id as string)}>编辑</TextButton>
          <TextButton onClick={() => handleContactDelete(record.id as string)}>删除</TextButton>
        </Space>
      ),
    },
  ];

  const handleFormSearch = (values: any) => {
    setConditions(values);
  };

  const handleAfterCreate = () => {
    setModalOptions({ id: "", open: false });
    searchForm();
  };

  const handleEditClick = (id: string) => {
    setModalOptions({ id, open: true });
  }

  return (
    <div>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="姓名" name="name">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button htmlType="submit" type="primary">
                查询
              </Button>
              <Button
                onClick={() => {
                  setModalOptions({ id: "", open: true });
                }}
              >
                新增
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SearchForm>
      <div className={styles.tableWrapper}>
        <Table
          rowKey="id"
          pagination={pagination}

          onChange={handlePageChange}
          loading={loading}
          dataSource={dataSource}
          columns={columns}
        />
      </div>

      <Modal
        destroyOnClose
        footer={null}
        title={modalOptions.id ? "编辑" : "新增"}
        open={modalOptions.open}
        onCancel={() => setModalOptions({ id: "", open: false })}
      >
        <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
      </Modal>
    </div>
  );
};
