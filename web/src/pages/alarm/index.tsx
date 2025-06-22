import styles from './index.module.less';

import { Button, Form, Input, Modal, Radio, Select, Table, TimePicker } from 'antd';
import { useState } from 'react';

import { createAlarm } from '@/services/alarm';

const Alarm = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
    },
    {
      title: '创建时间',
      dataIndex: 'title',
    },
    {
      title: '是否重复',
      dataIndex: 'title',
    },
  ];
  const [dataSource, setDataSource] = useState([
    {
      title: '周三暄暄葫芦丝',
      isRepeat: false,
    },
    {
      title: '周四七七葫芦丝',
      isRepeat: false,
    },
  ]);

  return (
    <>
      <Modal
        open={modalOpen}
        title="创建闹钟"
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          createAlarm({});
          // await form.validateFields();
        }}
      >
        <Form form={form} initialValues={{ repeat: true }} labelCol={{ span: 5 }}>
          <Form.Item label="标题" rules={[{ required: true }]} name="title">
            <Input placeholder="请输入标题时间" />
          </Form.Item>
          <Form.Item label="提醒时间" rules={[{ required: true }]} name="date">
            <Select
              placeholder="请选择提醒时间"
              mode="multiple"
              options={[
                { value: '1', label: '周一' },
                { value: '2', label: '周二' },
                { value: '3', label: '周三' },
                { value: '4', label: '周四' },
                { value: '5', label: '周五' },
                { value: '6', label: '周六' },
                { value: '7', label: '周日' },
              ]}
            />
          </Form.Item>
          <Form.Item label="提醒时间" name="time">
            <TimePicker placeholder="请选择提醒时间" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="是否重复" rules={[{ required: true }]} name="repeat">
            <Radio.Group
              options={[
                { value: true, label: '是' },
                { value: false, label: '否' },
              ]}
            ></Radio.Group>
          </Form.Item>
          <Form.Item label="备注" name="description">
            <Input.TextArea rows={4} autoSize placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <div className={styles.container}>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          新建
        </Button>
        <Table dataSource={dataSource} columns={columns} />
      </div>
    </>
  );
};

export default Alarm;
