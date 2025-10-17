import styles from './index.module.less';

import { Button, Form, Input, message, Modal, Radio, Select, Space, TimePicker } from 'antd';
import { useState } from 'react';

import { SearchForm, TextButton, Table, TableColumnType } from '@/components';
import { useTable } from '@/hooks';
import { createAlarm, deleteAlarm, queryAlarmList, sendMessageToWeChatWebhook, updateAlarm } from '@/services/alarm';
import moment from 'moment';

const Alarm = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [conditions, setConditions] = useState({});
  const { tableOptions, searchForm } = useTable({
    request: queryAlarmList,
    conditions,
  });
  const [editingRecord, setEditingRecord] = useState<any>();
  const columns: TableColumnType[] = [
    {
      title: '标题',
      dataIndex: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '是否重复',
      dataIndex: 'isRepeat',
      code: 'yesOrNo',
    },
    {
      title: '是否启用',
      dataIndex: 'isEnable',
      code: 'yesOrNo',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      dataType: 'date',
    },
    {
      title: '操作',
      dataIndex: 'id',
      render: (id: number, record: any) => {
        return (
          <Space size="large">
            <TextButton
              onClick={() => {
                sendMessageToWeChatWebhook({ id: id });
                message.success('消息已发送');
              }}
            >
              立即发送
            </TextButton>
            <TextButton
              onClick={() => {
                setEditingRecord(record);
                setModalOpen(true);
                form.setFieldsValue({ ...record, time: moment(record.time, 'HH:mm'), date: record.date.split(',') });
              }}
            >
              编辑
            </TextButton>
            <TextButton
              danger
              onClick={async () => {
                await deleteAlarm(id);
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

  return (
    <>
      <Modal
        open={modalOpen}
        title={`${editingRecord?.id ? '编辑' : '创建'}闹钟`}
        onCancel={() => {
          form.resetFields();
          setModalOpen(false);
          setEditingRecord(undefined);
        }}
        onOk={async () => {
          await form.validateFields();
          const values = form.getFieldsValue();
          if (editingRecord?.id) {
            await updateAlarm(editingRecord.id, {
              ...editingRecord,
              ...values,
              date: values.date.join(','),
              time: values.time?.format?.('HH:mm'),
            });
            message.success('编辑成功');
          } else {
            await createAlarm({ ...values, date: values.date.join(','), time: values.time?.format?.('HH:mm') });
            message.success('创建成功');
          }
          setModalOpen(false);
          searchForm();
          form.resetFields();
          setEditingRecord(undefined);
        }}
      >
        <Form form={form} initialValues={{ isRepeat: '1', isEnable: '1' }} labelCol={{ span: 5 }}>
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
          <Form.Item label="是否重复" rules={[{ required: true }]} name="isRepeat">
            <Radio.Group
              options={[
                { value: '1', label: '是' },
                { value: '0', label: '否' },
              ]}
            />
          </Form.Item>
          <Form.Item label="是否启用" rules={[{ required: true }]} name="isEnable">
            <Radio.Group
              options={[
                { value: '1', label: '启用' },
                { value: '0', label: '停用' },
              ]}
            />
          </Form.Item>
          <Form.Item label="备注" name="description">
            <Input.TextArea rows={4} autoSize placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

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
          <Button type="primary" onClick={() => setModalOpen(true)}>
            新建
          </Button>
        </Space>
      </SearchForm>
      <div className={styles.container}>
        <Table rowKey="id" columns={columns} {...tableOptions} />
      </div>
    </>
  );
};

export default Alarm;
