import { Card, SearchForm, Table, TableColumnType, TextButton } from '@/components';
import { useTable } from '@/hooks';
import { createStudentWork, deleteStudentWork, getStudentWorkList } from '@/services/studentWork';
import { Button, DatePicker, Form, Input, message, Modal, Space } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentWork = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [conditions, setConditions] = useState({});
  const { tableOptions, searchForm } = useTable({
    request: getStudentWorkList,
    conditions,
  });
  const navigate = useNavigate();

  const columns: TableColumnType[] = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 200,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 200,
      dataType: 'date',
    },
    {
      title: '操作',
      dataIndex: 'id',
      width: 200,
      render: (id: number, record: any) => {
        return (
          <Space size="large">
            <TextButton
              onClick={() => {
                form.setFieldsValue({ ...record, date: dayjs(record.date) });
                setModalVisible(true);
              }}
            >
              编辑
            </TextButton>
            <TextButton
              onClick={() => {
                navigate(`/student-work/manage/${id}`);
              }}
            >
              学科作业
            </TextButton>
            <TextButton
              danger
              onClick={async () => {
                await deleteStudentWork(id);
                message.success('删除成功');
                searchForm();
              }}
            >
              删除
            </TextButton>
          </Space>
        );
      },
    },
  ];

  // 打开创建作业弹框
  const openModal = () => {
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭弹框
  const handleCancel = () => {
    setModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : '',
      };

      await createStudentWork(formData);
      message.success('创建成功');
      setModalVisible(false);
      searchForm();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <>
      <SearchForm>
        <Space>
          <Input
            placeholder="请输入名称"
            onChange={(event) => {
              setConditions({ name: event.target.value });
            }}
          />
          <Button type="primary" onClick={() => searchForm()}>
            查询
          </Button>
          <Button type="primary" onClick={() => openModal()}>
            新建
          </Button>
        </Space>
      </SearchForm>
      <Card>
        <Table rowKey="id" columns={columns} {...tableOptions} />
      </Card>

      {/* 创建作业弹框 */}
      <Modal title="创建作业" open={modalVisible} onOk={handleSubmit} onCancel={handleCancel} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item hidden name="id">
            <Input />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StudentWork;
