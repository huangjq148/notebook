import React, { useEffect, useState } from "react";
import { Table, Form, Input, Button, Space, Modal, message } from "antd";
import { SearchForm } from "@/components";
import { useTable } from "@/hooks";
import { queryContact, deleteContact } from "@/services/contact";
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
      title: "操作",
      key: "operation",
      render: (record: Contact) => (
        <Button type="text" onClick={() => handleContactDelete(record.id as string)}>
          删除
        </Button>
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

  return (
    <div>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="姓名" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input />
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
