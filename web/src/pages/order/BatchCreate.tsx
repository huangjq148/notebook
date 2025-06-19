import { OrderContactInput, OrderProductInput, TextButton } from '@/components';
import { createOrder, queryOrderById, updateOrder } from '@/services/order';
import { DownOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, message, Modal, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import ContactList from './ContactList';
import styles from './index.module.less';
import ProductList from './ProductList';

type Props = {
  id?: number;
  onSubmit?: () => void;
};

type OrderProductInfo = {
  name: string;
  buyPrice: string;
  sellPrice: string;
  number: string;
  otherCost: string;
  tmpId: number;
};
type OrderProductInfoKey = keyof OrderProductInfo;

const EditTable = (props: { value?: OrderProductInfo[]; onChange?: (val?: OrderProductInfo[]) => void }) => {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<OrderProductInfo[]>([]);
  const [currentEditIndex, setCurrentEditIndex] = useState(-1);

  const handleRecordRemove = (recordIndex: number) => {
    setDataSource((val) => {
      const newVal = val.filter((val, index: number) => {
        return index != recordIndex;
      });
      return newVal;
    });
  };

  const handleDataSourceChange = (index: number, key: OrderProductInfoKey, newValue: any) => {
    setDataSource((value: OrderProductInfo[]) => {
      // @ts-ignore
      value[index][key] = newValue;
      props.onChange?.(
        value.filter((item) => {
          return item.name && item.number;
        }),
      );
      return value;
    });
  };

  const handleDataAdd = () => {
    setDataSource((val: any) => {
      const newDataSource = [
        ...val,
        {
          name: '',
          buyPrice: '',
          sellPrice: '',
          number: '',
          otherCost: '',
          tmpId: Date.now(),
        },
      ];
      setCurrentEditIndex(newDataSource.length - 1);
      return newDataSource;
    });
  };

  const handleProductSelect = (productInfo: Product) => {
    setDataSource((val) => {
      const newData = [...val];

      newData[currentEditIndex] = {
        ...val[currentEditIndex],
        name: productInfo.name,
        sellPrice: productInfo.sellPrice,
        buyPrice: productInfo.buyPrice,
        tmpId: Date.now(),
      };

      return newData;
    });

    setProductModalOpen(false);
  };

  const columns = [
    {
      title: '产品名',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (val: any, record: any, index: number) => {
        return index == currentEditIndex ? (
          <div
            style={{
              display: 'flex',
              width: '100%',
              gap: '5px',
            }}
          >
            <OrderProductInput
              value={val}
              onChange={(value) => handleDataSourceChange(index, 'name', value)}
              placeholder="产品名称"
            />
            <Button
              type="primary"
              onClick={() => {
                setProductModalOpen(true);
              }}
            >
              选择
            </Button>
          </div>
        ) : (
          val
        );
      },
    },
    {
      title: '进价',
      dataIndex: 'buyPrice',
      key: 'buyPrice',
      width: 100,
      render: (val: any, record: any, index: number) => {
        return index == currentEditIndex ? (
          <Input
            defaultValue={val}
            onChange={(e) => {
              handleDataSourceChange(index, 'buyPrice', e.target.value);
            }}
            placeholder="进价"
          />
        ) : (
          val
        );
      },
    },
    {
      title: '售价',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      width: 100,
      render: (val: any, record: any, index: number) => {
        return index == currentEditIndex ? (
          <Input
            defaultValue={val}
            onChange={(e) => {
              handleDataSourceChange(index, 'sellPrice', e.target.value);
            }}
            placeholder="售价"
          />
        ) : (
          val
        );
      },
    },
    {
      title: '数量',
      dataIndex: 'number',
      key: 'number',
      width: 100,
      render: (val: any, record: any, index: number) => {
        return index == currentEditIndex ? (
          <Input
            defaultValue={val}
            onChange={(e) => {
              handleDataSourceChange(index, 'number', e.target.value);
            }}
            placeholder="数量"
          />
        ) : (
          val
        );
      },
    },
    {
      title: '其他费用',
      dataIndex: 'otherCost',
      key: 'otherCost',
      width: 100,
      render: (val: any, record: any, index: number) => {
        return index == currentEditIndex ? (
          <Input
            defaultValue={val}
            onChange={(e) => {
              handleDataSourceChange(index, 'otherCost', e.target.value);
            }}
            placeholder="其他费用"
          />
        ) : (
          val || '-'
        );
      },
    },
    {
      title: (
        <>
          <PlusCircleOutlined onClick={handleDataAdd}>添加一行</PlusCircleOutlined>
        </>
      ),
      dataIndex: 'action',
      width: 80,
      key: 'action',
      render: (val: any, record: any, index: number) => {
        return (
          <Space>
            {index == currentEditIndex ? (
              <>
                <TextButton
                  onClick={() => {
                    setCurrentEditIndex(-1);
                  }}
                >
                  保存
                </TextButton>
              </>
            ) : (
              <>
                <TextButton onClick={() => setCurrentEditIndex(index)}>编辑</TextButton>
                <TextButton onClick={() => handleRecordRemove(index)}>删除</TextButton>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  useEffect(() => {
    props.onChange?.(
      dataSource.filter((item) => {
        return item.name && item.number;
      }),
    );
  }, [dataSource]);

  return (
    <>
      <Modal
        destroyOnClose
        footer={null}
        width={1000}
        open={productModalOpen}
        onCancel={() => setProductModalOpen(false)}
      >
        <ProductList onRowSelect={handleProductSelect} />
      </Modal>
      <Table<OrderProductInfo> rowKey="tmpId" pagination={false} columns={columns} dataSource={dataSource}></Table>
    </>
  );
};

export default (props: Props) => {
  const [oldData, setOldData] = useState<Partial<Order>>({});
  const [formRef] = Form.useForm();
  const [contactModal, setContactModal] = useState({
    open: false,
  });
  const [showMoreInfoSetting, setShowMoreInfoSetting] = useState(false);

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

  const handleFormSubmit = async (
    values: Order & {
      products: OrderProductInfo[];
    },
  ) => {
    values.orderTime = dayjs(values.orderTime).format('YYYY-MM-DD');
    if (props.id) {
      await updateOrder({
        ...oldData,
        ...values,
      });
    } else {
      const { products, ...restValues } = values;
      const productsLength = values.products?.length;

      if (!productsLength) {
        message.error('未添加产品信息');
        return;
      }

      for (let i = 0; i < productsLength; i++) {
        const item = values.products[i];
        const order = {
          ...item,
          ...restValues,
          status: '1',
          stockId: 0,
        };
        await createOrder(order);
      }
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

  return (
    <>
      <Form onFinish={handleFormSubmit} form={formRef}>
        <Form.Item
          name="orderTime"
          label="日期"
          style={{
            width: '400px',
          }}
        >
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
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '400px',
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
              <OrderContactInput placeholder="请输入姓名" />
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
          <Form.Item className={styles.toggleButton}>
            <div onClick={() => setShowMoreInfoSetting((val) => !val)}>
              {showMoreInfoSetting ? (
                <>
                  <MinusCircleOutlined /> 收起
                </>
              ) : (
                <>
                  <PlusCircleOutlined /> 更多
                </>
              )}
            </div>
          </Form.Item>
        </div>
        {showMoreInfoSetting && (
          <>
            <Form.Item
              label="电话"
              name="phone"
              style={{
                width: '400px',
              }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="地址"
              name="address"
              style={{
                width: '400px',
              }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="备注"
              name="remark"
              style={{
                width: '400px',
              }}
            >
              <Input />
            </Form.Item>
          </>
        )}
        <Form.Item name="products">
          <EditTable />
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
    </>
  );
};
