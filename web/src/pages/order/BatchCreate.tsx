import { OrderContactInput, PinyinMatchInput, TextButton } from '@/components';
import { createOrder, queryOrderById, queryProductsByOrders, updateOrder } from '@/services/order';
import { AudioOutlined, MinusCircleOutlined, PlusCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, message, Modal, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import ContactList from './ContactList';
import styles from './index.module.less';
import ProductList from './ProductList';
import { Contact, Order, Product } from '@/global';

import { matchVoiceProducts, parseSpokenNumber, parseVoiceActions, toProductPinyin, VoiceField } from './voiceInput';
import { useVoiceRecognition } from './useVoiceRecognition';

const STORAGE_KEY = 'batch_order_form_draft';

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

const createEmptyProduct = (): OrderProductInfo => ({
  name: '',
  buyPrice: '',
  sellPrice: '',
  number: '',
  otherCost: '',
  tmpId: Date.now() + Math.random(),
});

const EditTable = (props: { value?: OrderProductInfo[]; onChange?: (val?: OrderProductInfo[]) => void }) => {
  const [productModalOpen, setProductModalOpen] = useState(false);
  // 默认提供一行，方便直接录入
  const [dataSource, setDataSource] = useState<OrderProductInfo[]>([createEmptyProduct()]);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);

  const rowsRef = useRef(dataSource);
  rowsRef.current = dataSource;
  const editIndexRef = useRef(currentEditIndex);
  editIndexRef.current = currentEditIndex;
  const activeFieldRef = useRef<VoiceField>('name');
  const inputRefs = useRef<Partial<Record<VoiceField, { focus: () => void } | null>>>({});
  const [focusRequest, setFocusRequest] = useState<{ field: VoiceField }>();
  const [productNames, setProductNames] = useState<string[]>([]);
  const [productsReady, setProductsReady] = useState(false);
  const [voiceProductQuery, setVoiceProductQuery] = useState<string | null>(null);
  const [voiceOptions, setVoiceOptions] = useState<string[] | null>(null);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [voiceHint, setVoiceHint] = useState('');

  useEffect(() => {
    let cancelled = false;
    queryProductsByOrders()
      .then((names) => {
        if (!cancelled) {
          setProductNames([...new Set(names)]);
          setProductsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setVoiceHint('产品列表加载失败，请重新打开页面后重试');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const focusField = (field: VoiceField) => {
    const index = editIndexRef.current < 0 ? rowsRef.current.length - 1 : editIndexRef.current;
    if (index < 0) return;
    editIndexRef.current = index;
    setCurrentEditIndex(index);
    activeFieldRef.current = field;
    if (field !== 'name') setProductDropdownOpen(false);
    setFocusRequest({ field });
  };

  useEffect(() => {
    if (focusRequest) inputRefs.current[focusRequest.field]?.focus();
  }, [focusRequest, currentEditIndex]);

  // 同步外部 value 到内部 dataSource（用于数据回填）
  useEffect(() => {
    if (props.value && props.value.length > 0) {
      // 过滤掉空行后再比较，避免将用户正在编辑的空行误判为差异
      const filteredDataSource = dataSource.filter((item) => item.name && item.number);

      // 只有当外部 value 与当前 dataSource 不同时才同步
      const isDifferent =
        props.value.length !== filteredDataSource.length ||
        props.value.some((item, index) => {
          const current = filteredDataSource[index];
          return !current || item.name !== current.name || item.number !== current.number;
        });

      if (isDifferent) {
        setDataSource(
          props.value.map((item) => ({
            ...item,
            tmpId: item.tmpId || Date.now() + Math.random(),
          })),
        );
        // 回填的数据默认处于展示态，点击编辑后再修改
        setCurrentEditIndex(-1);
      }
    }
  }, [props.value]);

  const updateRows = (rows: OrderProductInfo[]) => {
    rowsRef.current = rows;
    setDataSource(rows);
  };

  const handleRecordRemove = (recordIndex: number) => {
    updateRows(rowsRef.current.filter((_, index) => index !== recordIndex));
    setVoiceProductQuery(null);
    setVoiceOptions(null);
  };

  const handleDataSourceChange = (index: number, key: OrderProductInfoKey, newValue: string) => {
    updateRows(rowsRef.current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: newValue } : row)));
  };

  const handleDataAdd = () => {
    if (rowsRef.current.some((item) => !item.name || !item.buyPrice || !item.sellPrice || !item.number)) {
      message.warning('请先完成当前行的产品名、进价、售价、数量填写');
      return false;
    }
    const rows = [...rowsRef.current, createEmptyProduct()];
    updateRows(rows);
    editIndexRef.current = rows.length - 1;
    setCurrentEditIndex(rows.length - 1);
    setVoiceProductQuery(null);
    setVoiceOptions(null);
    setProductDropdownOpen(false);
    focusField('name');
    return true;
  };

  const { listening, transcript, toggle } = useVoiceRecognition((text) => {
    for (const action of parseVoiceActions(text)) {
      if (action.type === 'field') {
        focusField(action.field);
        continue;
      }
      if (action.type === 'add') {
        if (!handleDataAdd()) break;
        continue;
      }
      const field = activeFieldRef.current;
      focusField(field);
      const index = editIndexRef.current;
      if (index < 0) continue;
      if (field === 'name') {
        const matches = matchVoiceProducts(productNames, action.value);
        setVoiceOptions(matches);
        setProductDropdownOpen(matches.length > 1);
        // 待确认结果只作为搜索词展示，不能作为已选产品提交。
        setVoiceProductQuery(matches.length === 1 ? null : toProductPinyin(action.value));
        handleDataSourceChange(index, 'name', matches.length === 1 ? matches[0] : '');
        setVoiceHint(
          matches.length === 1
            ? `已选中：${matches[0]}`
            : matches.length
              ? `匹配到 ${matches.length} 项，请选择产品`
              : '没有匹配的产品，请重说或手动选择',
        );
      } else {
        const number = parseSpokenNumber(action.value);
        if (number === undefined) {
          setVoiceHint('未识别到有效数字，请重说');
          continue;
        }
        handleDataSourceChange(index, field, number);
        setVoiceHint('');
      }
    }
  });

  const handleProductSelect = (productInfo: Product) => {
    const index = editIndexRef.current;
    updateRows(
      rowsRef.current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              name: productInfo.name,
              sellPrice: productInfo.sellPrice,
              buyPrice: productInfo.buyPrice,
            }
          : row,
      ),
    );
    setVoiceProductQuery(null);
    setVoiceOptions(null);
    setProductDropdownOpen(false);

    setProductModalOpen(false);
  };

  const columns = [
    {
      title: '产品名',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (val: any, record: any, index: number) => {
        return index == currentEditIndex ? (
          <div
            style={{
              display: 'flex',
              width: '100%',
              gap: '5px',
            }}
          >
            <PinyinMatchInput
              ref={(input) => {
                inputRefs.current.name = input;
              }}
              value={voiceProductQuery ?? val}
              options={(voiceOptions ?? productNames).map((name) => ({ value: name, label: name }))}
              open={productDropdownOpen}
              onOpenChange={setProductDropdownOpen}
              onFocus={() => {
                activeFieldRef.current = 'name';
              }}
              onChange={(value) => {
                setVoiceProductQuery(null);
                handleDataSourceChange(index, 'name', value);
              }}
              onSearch={() => {
                setVoiceOptions(null);
                setProductDropdownOpen(true);
              }}
              onSelect={() => {
                setVoiceProductQuery(null);
                setVoiceOptions(null);
                setProductDropdownOpen(false);
                setVoiceHint('');
              }}
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
            ref={(input) => {
              inputRefs.current.buyPrice = input;
            }}
            value={val}
            onFocus={() => {
              activeFieldRef.current = 'buyPrice';
            }}
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
            ref={(input) => {
              inputRefs.current.sellPrice = input;
            }}
            value={val}
            onFocus={() => {
              activeFieldRef.current = 'sellPrice';
            }}
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
            ref={(input) => {
              inputRefs.current.number = input;
            }}
            value={val}
            onFocus={() => {
              activeFieldRef.current = 'number';
            }}
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
            ref={(input) => {
              inputRefs.current.otherCost = input;
            }}
            value={val}
            onFocus={() => {
              activeFieldRef.current = 'otherCost';
            }}
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
                    // 检查之前的数据是否填写完整
                    const hasEmptyRow = !record.name || !record.buyPrice || !record.sellPrice || !record.number;

                    if (hasEmptyRow) {
                      message.warning('请先完成当前行的产品名、进价、售价、数量填写');
                      return val;
                    }
                    setCurrentEditIndex(-1);
                  }}
                >
                  保存
                </TextButton>
              </>
            ) : (
              <>
                <TextButton
                  onClick={() => {
                    editIndexRef.current = index;
                    setCurrentEditIndex(index);
                    setVoiceProductQuery(null);
                    setVoiceOptions(null);
                  }}
                >
                  编辑
                </TextButton>
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
        title="选择产品"
        width={1000}
        open={productModalOpen}
        onCancel={() => setProductModalOpen(false)}
      >
        <ProductList onRowSelect={handleProductSelect} />
      </Modal>
      <div className={styles.voiceToolbar}>
        <Button
          icon={listening ? <StopOutlined /> : <AudioOutlined />}
          type={listening ? 'primary' : 'default'}
          danger={listening}
          disabled={!productsReady}
          aria-pressed={listening}
          onClick={() => {
            if (!listening) focusField('name');
            toggle();
          }}
        >
          {listening ? '停止语音' : '语音录入'}
        </Button>
        <span>说“产品名 / 进价 / 售价 / 数量 / 其他费用”切换列，说“新增”添加下一行</span>
      </div>
      <div className={styles.voiceStatus} aria-live="polite">
        {listening && <span>正在聆听{transcript ? `：${transcript}` : '…'}</span>}
        {voiceHint && <span>{voiceHint}</span>}
      </div>
      <Table<OrderProductInfo> rowKey="tmpId" pagination={false} columns={columns} dataSource={dataSource}></Table>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button type="dashed" onClick={handleDataAdd} icon={<PlusCircleOutlined />}>
          新增
        </Button>
      </div>
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
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [cachedData, setCachedData] = useState<any>(null);
  const hasRestoredRef = useRef(false);
  const contactInputRef = useRef<any>(null);

  const handleContactSelect = (val: Contact) => {
    formRef.setFieldsValue({
      contact: val.realname,
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
    setIsRestoreModalOpen(false);
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

    // 检查是否有缓存的草稿数据（仅在新增模式下）
    if (!props.id) {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setCachedData(parsed);
          setIsRestoreModalOpen(true);
        } else {
          // 没有缓存数据，直接允许保存草稿
          hasRestoredRef.current = true;
        }
      } catch (e) {
        console.error('读取草稿失败:', e);
        hasRestoredRef.current = true;
      }
    }
  }, [props.id]);

  // 打开弹框后默认聚焦姓名输入框，便于直接录入
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isRestoreModalOpen) return;
      contactInputRef.current?.focus?.();
      const activeElement = document.activeElement as HTMLInputElement | null;
      activeElement?.select?.();
    }, 100);

    return () => clearTimeout(timer);
  }, [isRestoreModalOpen]);

  // 监听表单值变化，自动保存草稿
  const handleValuesChange = (_: any, allValues: any) => {
    saveDraft(allValues);
  };

  return (
    <>
      <Form onFinish={handleFormSubmit} form={formRef} onValuesChange={handleValuesChange}>
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
              <OrderContactInput ref={contactInputRef} placeholder="请输入姓名" />
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

      {/* 恢复草稿确认弹框 */}
      <Modal
        title="恢复草稿"
        open={isRestoreModalOpen}
        onOk={restoreDraft}
        onCancel={ignoreDraft}
        okText="恢复"
        cancelText="忽略"
        centered
      >
        <p>检测到上次有未提交的批量订单数据，是否恢复？</p>
      </Modal>
    </>
  );
};
