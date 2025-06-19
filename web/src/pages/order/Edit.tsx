import React, { useEffect, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, message, Modal } from 'antd';
import { createOrder, updateOrder, queryOrderById } from '@/services/order';
import ContactList from './ContactList';
import ProductList from './ProductList';
import dayjs from 'dayjs';
import { OrderContactInput, OrderProductInput } from '@/components';

type Props = {
  id?: number;
  onSubmit?: () => void;
  stockInfo?: Partial<Stock>;
};

export default (props: Props) => {
  const [oldData, setOldData] = useState<Partial<Order>>({});
  const [formRef] = Form.useForm();
  const [productModal, setProductModal] = useState({
    open: false,
  });
  const [contactModal, setContactModal] = useState({
    open: false,
  });

  const handleContactSelect = (val: Contact) => {
    formRef.setFieldsValue({
      contact: val.name,
      phone: val.phone,
      address: val.address,
    });

    setContactModal({
      open: false,
    });
  };

  const handleProductSelect = (val: Product) => {
    formRef.setFieldsValue({
      name: val.name,
      sellPrice: val.sellPrice,
      buyPrice: val.buyPrice,
    });

    setProductModal({
      open: false,
    });
  };

  const handleFormSubmit = async (values: Order) => {
    values.orderTime = dayjs(values.orderTime).format('YYYY-MM-DD');
    if (props.id) {
      await updateOrder({
        ...oldData,
        ...values,
      });
    } else {
      await createOrder({
        ...values,
        status: '1',
        stockId: props.stockInfo?.id ? props.stockInfo.id : 0,
      });
    }
    message.success('保存成功');
    props?.onSubmit?.();
  };

  const loadData = async () => {
    if (props.id) {
      const data = await queryOrderById(props.id);
      const showDate = dayjs(dayjs(data.orderTime), 'YYYY-MM-DD');
      formRef.setFieldsValue({
        ...data,
        orderTime: showDate,
      });
      setOldData({
        ...data,
        orderTime: showDate as any,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [props.id]);

  useEffect(() => {
    if (props.stockInfo) {
      formRef.setFieldsValue({
        name: props.stockInfo.name,
        sellPrice: props.stockInfo.sellPrice,
        buyPrice: props.stockInfo.buyPrice,
        number: props.stockInfo.number,
      });
    }
  }, []);

  return (
    <>
      <Form onFinish={handleFormSubmit} form={formRef} initialValues={{}}>
        <Form.Item name="orderTime" label="日期">
          <DatePicker
            allowClear={false}
            presets={[
              {
                label: '昨天',
                value: dayjs().add(-1, 'day'),
              },
              {
                label: '今天',
                value: dayjs(),
              },
            ]}
            defaultValue={dayjs(dayjs(), 'YYYY-MM-DD')}
          />
        </Form.Item>
        <div
          style={{
            display: 'flex',
            width: '100%',
          }}
        >
          <Form.Item
            label="产品名"
            name="name"
            style={{
              width: '100%',
              marginRight: '10px',
            }}
            rules={[
              {
                required: true,
                message: '请输入产品名',
              },
            ]}
          >
            <OrderProductInput disabled={!!props.stockInfo} />
          </Form.Item>
          <Button
            type="primary"
            disabled={!!props.stockInfo}
            onClick={() =>
              setProductModal({
                open: true,
              })
            }
          >
            选择
          </Button>
        </div>
        <div
          style={{
            display: 'flex',
            width: '100%',
          }}
        >
          <Form.Item
            label="姓名"
            name="contact"
            style={{
              width: '100%',
              marginRight: '10px',
            }}
            rules={[
              {
                required: true,
                message: '请输入姓名',
              },
            ]}
          >
            <OrderContactInput />
          </Form.Item>
          <Button
            type="primary"
            onClick={() =>
              setContactModal({
                open: true,
              })
            }
          >
            选择
          </Button>
        </div>
        <Form.Item label="电话" name="phone">
          <Input placeholder="请输入电话" />
        </Form.Item>
        <Form.Item label="地址" name="address">
          <Input placeholder="请输入地址" />
        </Form.Item>
        <Form.Item
          label="进价"
          name="buyPrice"
          rules={[
            {
              required: true,
              message: '请输入进价',
            },
          ]}
        >
          <Input placeholder="请输入进价" disabled={!!props.stockInfo} />
        </Form.Item>
        <Form.Item
          label="售价"
          name="sellPrice"
          rules={[
            {
              required: true,
              message: '请输入售价',
            },
          ]}
        >
          <Input placeholder="请输入售价" />
        </Form.Item>
        <Form.Item
          label="数量"
          name="number"
          rules={[
            {
              required: true,
              message: '请输入数量',
            },
            {
              validator: async (rule, value: number) => {
                if (props.stockInfo && value > parseFloat(`${props.stockInfo?.number ?? 0}`)) {
                  throw new Error('出货数量不能大于库存');
                }
              },
            },
          ]}
        >
          <Input placeholder="请输入数量" />
        </Form.Item>
        <Form.Item label="其他费用" name="otherCost">
          <Input placeholder="请输入其他费用" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input placeholder="请输入备注" />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary">
            保存
          </Button>
        </Form.Item>
      </Form>

      <Modal
        destroyOnClose
        footer={null}
        width={1000}
        open={contactModal.open}
        onCancel={() =>
          setContactModal({
            open: false,
          })
        }
      >
        <ContactList onRowSelect={handleContactSelect} />
      </Modal>

      <Modal
        destroyOnClose
        footer={null}
        width={1000}
        open={productModal.open}
        onCancel={() =>
          setProductModal({
            open: false,
          })
        }
      >
        <ProductList onRowSelect={handleProductSelect} />
      </Modal>
    </>
  );
};
