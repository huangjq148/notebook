import { OrderContactInput, OrderProductInput } from '@/components';
import { Contact, Order, Product, Stock } from '@/global';
import { createOrder, queryOrderById, updateOrder } from '@/services/order';
import { Button, DatePicker, Form, Input, message, Modal } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import ContactList from './ContactList';
import ProductList from './ProductList';

const STORAGE_KEY = 'order_form_draft';

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
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [cachedData, setCachedData] = useState<any>(null);
  const hasRestoredRef = useRef(false);

  const handleContactSelect = (val: Contact) => {
    formRef.setFieldsValue({
      contact: val.realname,
      phone: val.phone || '',
      address: val.address || '',
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
    // 提交成功后清除缓存
    clearDraft();
    message.success('保存成功');
    props?.onSubmit?.();
  };

  // 保存草稿到 localStorage
  const saveDraft = (values: any) => {
    if (props.id) return; // 编辑模式不缓存
    if (!hasRestoredRef.current) return; // 数据回填完成前不保存
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch (e) {
      console.error('保存草稿失败:', e);
    }
  };

  // 从 localStorage 恢复草稿
  const restoreDraft = () => {
    if (cachedData) {
      // 将日期字符串转换回 dayjs 对象
      const restoredData = {
        ...cachedData,
        orderTime: cachedData.orderTime ? dayjs(cachedData.orderTime) : dayjs(),
      };
      formRef.setFieldsValue(restoredData);
      message.success('数据已回填');
    }
    hasRestoredRef.current = true;
    setIsRestoreModalOpen(false);
  };

  // 清除草稿
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('清除草稿失败:', e);
    }
  };

  // 忽略草稿
  const ignoreDraft = () => {
    hasRestoredRef.current = true;
    clearDraft();
    // 延迟重置表单确保 Form 已挂载
    setTimeout(() => {
      formRef.resetFields();
      formRef.setFieldsValue({
        orderTime: dayjs(),
      });
    }, 0);
    setIsRestoreModalOpen(false);
  };

  const loadData = async () => {
    if (props.id) {
      const data = await queryOrderById(props.id);
      const showDate = dayjs(dayjs(data.orderTime), 'YYYY-MM-DD');
      formRef.setFieldsValue({
        ...data,
        orderTime: showDate,
        phone: data.phone || '',
        address: data.address || '',
        remark: data.remark || '',
      });
      setOldData({
        ...data,
        orderTime: showDate as any,
      });
    } else {
      // 新增模式：延迟重置表单，确保 Form 实例已准备好
      setTimeout(() => {
        formRef.resetFields();
        const initialValues: any = {
          orderTime: dayjs(),
        };
        if (props.stockInfo) {
          initialValues.name = props.stockInfo.name;
          initialValues.sellPrice = props.stockInfo.sellPrice;
          initialValues.buyPrice = props.stockInfo.buyPrice;
          initialValues.number = props.stockInfo.number;
        }
        formRef.setFieldsValue(initialValues);
        hasRestoredRef.current = true;
      }, 0);
    }
  };

  useEffect(() => {
    // 重置恢复标记
    hasRestoredRef.current = false;
    loadData();

    // 检查是否有缓存的草稿数据（仅在新增模式下）
    if (!props.id) {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setCachedData(parsed);
          setIsRestoreModalOpen(true);
        }
      } catch (e) {
        console.error('读取草稿失败:', e);
      }
    }
  }, [props.id, props.stockInfo]);

  // 监听表单值变化，自动保存草稿
  const handleValuesChange = (_: any, allValues: any) => {
    saveDraft(allValues);
  };

  return (
    <>
      <Form onFinish={handleFormSubmit} form={formRef} initialValues={{}} onValuesChange={handleValuesChange}>
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
        title="选择客户"
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
        title="选择产品"
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

      {/* 恢复草稿确认弹框 */}
      <Modal
        title="恢复草稿"
        open={isRestoreModalOpen}
        onOk={restoreDraft}
        onCancel={ignoreDraft}
        okText="恢复"
        cancelText="忽略"
      >
        <p>检测到上次有未提交的订单数据，是否恢复？</p>
      </Modal>
    </>
  );
};
