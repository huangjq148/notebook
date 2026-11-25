import { DeleteConfirmButton, DEFAULT_TABLE_SCROLL, PinyinMatchInput, TextButton } from '@/components';
import {
  createOrderBatch,
  queryOrderById,
  queryContactsByOrders,
  queryProductsByOrders,
  updateOrder,
} from '@/services/order';
import { AudioOutlined, MinusCircleOutlined, PlusCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, message, Modal, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import ContactList from './ContactList';
import styles from './index.module.less';
import ProductList from './ProductList';
import { Contact, Order, Product } from '@/global';

import { matchVoiceNames, parseSpokenNumber, parseVoiceActions, toNamePinyin, VoiceField } from './voiceInput';
import { useVoiceRecognition } from './useVoiceRecognition';
import { batchTotals, isEmptyProduct, productError, rowAmounts } from './batchOrder';

const STORAGE_KEY = 'batch_order_form_draft';

type Props = {
  id?: number;
  onSubmit?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
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

const EditTable = (props: {
  disabled?: boolean;
  value?: OrderProductInfo[];
  onChange?: (val?: OrderProductInfo[]) => void;
  activeFieldRef: { current: VoiceField };
  onContactFocus: () => void;
  onContactPreview: (value: string | undefined) => void;
  onContactChange: (value: string) => void;
  onVoiceContactSelect: (index: number) => void;
}) => {
  const [productModalOpen, setProductModalOpen] = useState(false);
  // 默认提供一行，方便直接录入
  const [dataSource, setDataSource] = useState<OrderProductInfo[]>(props.value ?? [createEmptyProduct()]);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);

  const rowsRef = useRef(dataSource);
  rowsRef.current = dataSource;
  const editIndexRef = useRef(currentEditIndex);
  editIndexRef.current = currentEditIndex;
  const { activeFieldRef } = props;
  const inputRefs = useRef<Partial<Record<VoiceField, { focus: () => void } | null>>>({});
  const [focusRequest, setFocusRequest] = useState<{ field: VoiceField }>();
  const [productNames, setProductNames] = useState<string[]>([]);
  const [productsReady, setProductsReady] = useState(false);
  const [voiceProductQuery, setVoiceProductQuery] = useState<string | null>(null);
  const [voiceOptions, updateVoiceOptions] = useState<string[] | null>(null);
  const voiceOptionsRef = useRef<string[] | null>(null);
  const setVoiceOptions = (options: string[] | null) => {
    voiceOptionsRef.current = options;
    updateVoiceOptions(options);
  };
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [voiceHint, setVoiceHint] = useState('');
  const [voicePreview, setVoicePreview] = useState<Partial<Record<VoiceField, string>>>({});

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
    if (field === 'contact') {
      activeFieldRef.current = field;
      setProductDropdownOpen(false);
      // 取消尚未执行的表格聚焦，避免抢回姓名输入框的焦点。
      setFocusRequest(undefined);
      props.onContactFocus();
      return;
    }
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

  // Keep incomplete rows in the form and draft too; submission validates them.
  useEffect(() => {
    if (props.value && JSON.stringify(props.value) !== JSON.stringify(rowsRef.current)) {
      rowsRef.current = props.value;
      setDataSource(props.value);
      setCurrentEditIndex(props.value.length ? 0 : -1);
    }
  }, [props.value]);

  const updateRows = (rows: OrderProductInfo[]) => {
    if (props.disabled) return;
    rowsRef.current = rows;
    setDataSource(rows);
    props.onChange?.(rows);
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
    if (rowsRef.current.some((item) => productError(item))) {
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

  const handlePreviousRow = () => {
    const currentIndex = editIndexRef.current < 0 ? rowsRef.current.length - 1 : editIndexRef.current;
    if (currentIndex <= 0) {
      message.info('当前已是第一行，没有上一行');
      return false;
    }
    editIndexRef.current = currentIndex - 1;
    setCurrentEditIndex(currentIndex - 1);
    setVoiceProductQuery(null);
    setVoiceOptions(null);
    setProductDropdownOpen(false);
    focusField('name');
    setVoiceHint(`已切换到第 ${currentIndex} 行`);
    return true;
  };

  const { listening, transcript, toggle, stop } = useVoiceRecognition(
    (text) => {
      if (props.disabled) return;
      for (const action of parseVoiceActions(text)) {
        if (action.type === 'field') {
          focusField(action.field);
          continue;
        }
        if (action.type === 'select') {
          if (activeFieldRef.current === 'contact') {
            props.onVoiceContactSelect(action.index);
          } else if (activeFieldRef.current === 'name') {
            const candidates = voiceOptionsRef.current;
            if (!candidates || candidates.length < 2) {
              setVoiceHint('当前没有待选产品');
            } else if (!Number.isInteger(action.index) || action.index < 0 || action.index >= candidates.length) {
              setVoiceHint(`请选择第 1 到第 ${candidates.length} 项`);
            } else {
              const name = candidates[action.index];
              handleDataSourceChange(editIndexRef.current, 'name', name);
              setVoiceProductQuery(null);
              setVoiceOptions(null);
              setProductDropdownOpen(false);
              focusField('name');
              setVoiceHint(`已选中：${name}`);
            }
          } else {
            setVoiceHint('请先切换到姓名或产品名，再选择候选项');
          }
          continue;
        }
        if (action.type === 'previous') {
          if (!handlePreviousRow()) break;
          continue;
        }
        if (action.type === 'add') {
          if (!handleDataAdd()) break;
          continue;
        }
        const field = activeFieldRef.current;
        focusField(field);
        if (field === 'contact') {
          props.onContactChange(action.value);
          setVoiceHint('');
          continue;
        }
        const index = editIndexRef.current;
        if (index < 0) continue;
        if (field === 'name') {
          const matches = matchVoiceNames(productNames, action.value);
          setVoiceOptions(matches);
          setProductDropdownOpen(matches.length > 1);
          // 待确认结果只作为搜索词展示，不能作为已选产品提交。
          setVoiceProductQuery(matches.length === 1 ? null : toNamePinyin(action.value));
          handleDataSourceChange(index, 'name', matches.length === 1 ? matches[0] : '');
          setVoiceHint(
            matches.length === 1
              ? `已选中：${matches[0]}`
              : matches.length
                ? `匹配到 ${matches.length} 项，可说“第几个”选择产品`
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
    },
    (text) => {
      const preview: Partial<Record<VoiceField, string>> = {};
      let field = activeFieldRef.current;
      for (const action of parseVoiceActions(text)) {
        if (action.type === 'field') {
          field = action.field;
        } else if (action.type === 'value') {
          preview[field] =
            field === 'contact' || field === 'name' ? action.value : (parseSpokenNumber(action.value) ?? action.value);
        } else {
          // 行切换和候选选择会改变后续指令的目标，等最终结果再执行。
          break;
        }
      }
      props.onContactPreview(preview.contact);
      setVoicePreview(preview);
    },
  );

  useEffect(() => {
    if (props.disabled) stop();
  }, [props.disabled]);

  const handleProductSelect = (productInfo: Product) => {
    if (props.disabled) return;
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
              value={voicePreview.name ?? voiceProductQuery ?? val}
              options={(voiceOptions ?? productNames).map((name, index) => ({
                value: name,
                label: voiceOptions && voiceOptions.length > 1 ? `${index + 1}. ${name}` : name,
              }))}
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
            value={voicePreview.buyPrice ?? val}
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
            value={voicePreview.sellPrice ?? val}
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
            value={voicePreview.number ?? val}
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
            value={voicePreview.otherCost ?? val}
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
      title: '销售金额',
      key: 'sales',
      width: 120,
      render: (_: unknown, row: OrderProductInfo) => {
        const value = rowAmounts(row).sales;
        return <span className={styles.amount}>{value ? `¥${value.toFixed(2)}` : '—'}</span>;
      },
    },
    {
      title: '利润',
      key: 'profit',
      width: 120,
      render: (_: unknown, row: OrderProductInfo) => {
        const value = rowAmounts(row).profit;
        return (
          <span className={styles.amount} style={{ color: value?.isNegative() ? '#cf1322' : undefined }}>
            {value ? `¥${value.toFixed(2)}` : '—'}
          </span>
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
                    const hasEmptyRow = productError(record);

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
                <DeleteConfirmButton onConfirm={() => handleRecordRemove(index)}>
                  <TextButton danger>删除</TextButton>
                </DeleteConfirmButton>
              </>
            )}
          </Space>
        );
      },
    },
  ];

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
            if (!listening) focusField(activeFieldRef.current);
            toggle();
          }}
        >
          {listening ? '停止语音' : '语音录入'}
        </Button>
        <span>说“姓名 / 产品名 / 进价 / 售价 / 数量 / 其他费用”切换输入，说“上一行”切换，说“新增”添加下一行</span>
      </div>
      <div className={styles.voiceStatus} aria-live="polite">
        {listening && <span>正在聆听{transcript ? `：${transcript}` : '…'}</span>}
        {voiceHint && <span>{voiceHint}</span>}
      </div>
      <Table<OrderProductInfo>
        rowKey="tmpId"
        scroll={DEFAULT_TABLE_SCROLL}
        pagination={false}
        columns={columns}
        dataSource={dataSource}
      />
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
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const pendingSubmissionRef = useRef<{ requestId: string; fingerprint: string } | undefined>(undefined);
  const [initialValues] = useState(() => ({ orderTime: dayjs(), products: [createEmptyProduct()] }));
  const products = Form.useWatch('products', formRef) as OrderProductInfo[] | undefined;
  const totals = batchTotals(products ?? []);
  const contactInputRef = useRef<any>(null);
  const activeFieldRef = useRef<VoiceField>('contact');
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [contactNames, setContactNames] = useState<string[] | null>(null);
  const [contactPreview, setContactPreview] = useState<string>();
  const [voiceContactQuery, setVoiceContactQuery] = useState<string | null>(null);
  const [voiceContactOptions, setVoiceContactOptions] = useState<string[] | null>(null);
  const voiceContactOptionsRef = useRef<string[] | null>(null);
  const [contactVoiceHint, setContactVoiceHint] = useState('');

  useEffect(() => {
    let cancelled = false;
    queryContactsByOrders()
      .then((names) => {
        if (!cancelled) setContactNames([...new Set(names)]);
      })
      .catch(() => {
        if (!cancelled) setContactVoiceHint('姓名列表加载失败，请重新打开页面后重试');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearContactSearch = () => {
    setVoiceContactQuery(null);
    setVoiceContactOptions(null);
    voiceContactOptionsRef.current = null;
    setContactVoiceHint('');
  };

  const handleContactSelect = (val: Contact) => {
    if (submittingRef.current) return;
    clearContactSearch();
    setContactDropdownOpen(false);
    formRef.setFieldsValue({
      contact: val.realname,
      phone: val.phone,
      address: val.address,
    });

    setContactModal({ open: false });
    saveDraft(formRef.getFieldsValue());
  };

  const handleFormSubmit = async (values: Order & { products: OrderProductInfo[] }) => {
    if (submittingRef.current) return;
    const rows = values.products ?? [];
    const filledRows = rows.filter((row) => !isEmptyProduct(row));
    if (!filledRows.length) {
      message.error('请至少填写一行商品');
      return;
    }
    const invalidIndex = rows.findIndex((row) => !isEmptyProduct(row) && productError(row));
    if (invalidIndex >= 0) {
      message.error(`第 ${invalidIndex + 1} 行：${productError(rows[invalidIndex])}`);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    props.onSubmittingChange?.(true);
    try {
      if (props.id) {
        await updateOrder({ ...oldData, ...values, orderTime: dayjs(values.orderTime).format('YYYY-MM-DD') });
      } else {
        const orders = filledRows.map((row) => ({
          name: row.name.trim(),
          buyPrice: row.buyPrice,
          sellPrice: row.sellPrice,
          number: row.number,
          otherCost: row.otherCost || '0',
          contact: values.contact.trim(),
          phone: values.phone || '',
          address: values.address || '',
          remark: values.remark || '',
          orderTime: dayjs(values.orderTime).format('YYYY-MM-DD'),
        }));
        const fingerprint = JSON.stringify(orders);
        if (pendingSubmissionRef.current?.fingerprint !== fingerprint) {
          // getRandomValues also works on local HTTP deployments without randomUUID.
          const bytes = crypto.getRandomValues(new Uint8Array(16));
          const requestId = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
          pendingSubmissionRef.current = { requestId, fingerprint };
        }
        // Persist the receipt key BEFORE sending so a lost response / reload can retry safely.
        saveDraft(values);
        await createOrderBatch(pendingSubmissionRef.current.requestId, orders);
      }
      clearDraft();
      message.success('保存成功');
      props.onSubmit?.();
    } catch {
      message.error('保存未确认成功，录入内容已保留，请重试；同一提交不会重复创建');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      props.onSubmittingChange?.(false);
    }
  };

  // 保存草稿到 localStorage
  const saveDraft = (values: any) => {
    if (props.id) return; // 编辑模式不缓存
    if (!hasRestoredRef.current) return; // 数据回填完成前不保存
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...values, _submission: pendingSubmissionRef.current }));
    } catch (e) {
      console.error('保存草稿失败:', e);
    }
  };

  // 从 localStorage 恢复草稿
  const restoreDraft = () => {
    if (cachedData) {
      // 将日期字符串转换回 dayjs 对象
      pendingSubmissionRef.current = cachedData._submission;
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
    pendingSubmissionRef.current = undefined;
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
      <Form
        onFinish={handleFormSubmit}
        form={formRef}
        onValuesChange={handleValuesChange}
        disabled={submitting}
        initialValues={initialValues}
      >
        <div inert={submitting}>
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
                getValueProps={(contact) => ({ value: contactPreview ?? voiceContactQuery ?? contact })}
                extra={contactVoiceHint || undefined}
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
                <PinyinMatchInput
                  ref={contactInputRef}
                  options={(voiceContactOptions ?? contactNames ?? []).map((name, index) => ({
                    value: name,
                    label: voiceContactOptions && voiceContactOptions.length > 1 ? `${index + 1}. ${name}` : name,
                  }))}
                  placeholder="请输入姓名"
                  open={contactDropdownOpen}
                  onOpenChange={setContactDropdownOpen}
                  onFocus={() => {
                    activeFieldRef.current = 'contact';
                  }}
                  onChange={clearContactSearch}
                  onSearch={() => setContactDropdownOpen(true)}
                  onSelect={() => {
                    clearContactSearch();
                    setContactDropdownOpen(false);
                  }}
                />
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
            <EditTable
              disabled={submitting}
              activeFieldRef={activeFieldRef}
              onContactPreview={setContactPreview}
              onContactFocus={() => contactInputRef.current?.focus?.()}
              onContactChange={(spoken) => {
                if (!contactNames) {
                  setContactVoiceHint('姓名列表尚未加载完成，请稍后重试');
                  return;
                }
                const matches = matchVoiceNames(contactNames, spoken);
                voiceContactOptionsRef.current = matches;
                setVoiceContactOptions(matches);
                setVoiceContactQuery(matches.length === 1 ? null : toNamePinyin(spoken));
                formRef.setFieldsValue({ contact: matches.length === 1 ? matches[0] : '' });
                setContactDropdownOpen(matches.length > 1);
                setContactVoiceHint(
                  matches.length === 1
                    ? `已选中：${matches[0]}`
                    : matches.length
                      ? `匹配到 ${matches.length} 项，可说“第几个”选择`
                      : '没有匹配的姓名，请重说或手动输入',
                );
                // 未确认的拼音只用于搜索，不写入草稿或提交数据。
                saveDraft(formRef.getFieldsValue());
              }}
              onVoiceContactSelect={(index) => {
                const candidates = voiceContactOptionsRef.current;
                if (!candidates || candidates.length < 2) {
                  setContactVoiceHint('当前没有待选姓名');
                  return;
                }
                if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
                  setContactVoiceHint(`请选择第 1 到第 ${candidates.length} 项`);
                  return;
                }
                const contact = candidates[index];
                formRef.setFieldsValue({ contact });
                clearContactSearch();
                setContactDropdownOpen(false);
                setContactVoiceHint(`已选中：${contact}`);
                contactInputRef.current?.focus?.();
                saveDraft(formRef.getFieldsValue());
              }}
            />
          </Form.Item>
        </div>
        <div className={styles.batchSummary}>
          <div className={styles.batchSummaryValues} aria-live="polite">
            <span>
              商品行数 <strong>{totals.count}</strong>
            </span>
            <span>
              总金额 <strong>¥{totals.sales.toFixed(2)}</strong>
            </span>
            <span>
              总利润{' '}
              <strong style={{ color: totals.profit.isNegative() ? '#cf1322' : undefined }}>
                ¥{totals.profit.toFixed(2)}
              </strong>
            </span>
            {totals.invalid > 0 && (
              <span className={styles.incompleteHint}>{totals.invalid} 行待完善，汇总仅计可计算金额</span>
            )}
          </div>
          <Button htmlType="submit" type="primary" loading={submitting} disabled={submitting || totals.count === 0}>
            {submitting ? '保存中…' : '保存订单'}
          </Button>
        </div>
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
