import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { createProduct, updateProduct, queryProductById } from '@/services/product';
import { Product } from '@/global';

type Props = {
  id?: number;
  onSubmit?: () => void;
};

export default (props: Props) => {
  const [oldData, setOldData] = useState<Partial<Product>>({});
  const [formRef] = Form.useForm();

  const handleFormSubmit = async (values: Product) => {
    try {
      if (props.id) {
        await updateProduct({
          ...oldData,
          ...values,
        });
      } else {
        await createProduct(values);
      }
      message.success('保存成功');
      props?.onSubmit?.();
    } catch (e) {
      message.error("操作失败，请稍后重试");
    }
  };

  const loadData = async () => {
    if (props.id) {
      const data = await queryProductById(props.id);
      formRef.setFieldsValue(data);
      setOldData(data);
    }
  };

  useEffect(() => {
    loadData();
  }, [props.id]);

  return (
    <Form onFinish={handleFormSubmit} form={formRef}>
      <Form.Item label="产品" name="name">
        <Input placeholder="产品名称" />
      </Form.Item>
      <Form.Item label="进价" name="buyPrice">
        <Input placeholder="进价" />
      </Form.Item>
      <Form.Item label="售价" name="sellPrice">
        <Input placeholder="售价" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
};
