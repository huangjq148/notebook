import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { createContact, queryContactById, updateContact } from '@/services/contact';

type Props = {
  id?: string;
  onSubmit?: () => void;
};

export default (props: Props) => {
  const [oldData, setOldData] = useState<Partial<Contact>>({});
  const [formRef] = Form.useForm();

  const handleFormSubmit = async (values: Contact) => {
    if (props.id) {
      await updateContact({
        ...oldData,
        ...values,
      });
    } else {
      await createContact(values);
    }
    message.success('保存成功');
    props?.onSubmit?.();
  };

  const loadData = async () => {
    if (props.id) {
      const data = await queryContactById(props.id);
      formRef.setFieldsValue(data);
      setOldData(data);
    }
  };

  useEffect(() => {
    loadData();
  }, [props.id]);

  return (
    <Form onFinish={handleFormSubmit} form={formRef}>
      <Form.Item label="姓名" name="name">
        <Input placeholder="联系人姓名" />
      </Form.Item>
      <Form.Item label="电话" name="phone">
        <Input placeholder="联系人电话" />
      </Form.Item>
      <Form.Item label="地址" name="address">
        <Input placeholder="联系人地址" />
      </Form.Item>
      <Form.Item>
        <Button htmlType="submit">保存</Button>
      </Form.Item>
    </Form>
  );
};
