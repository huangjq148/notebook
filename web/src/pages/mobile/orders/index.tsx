import { DateRangePicker, OrderContactInput, OrderProductInput } from '@/components';
import { Contact, Order, Product } from '@/global';
import ContactList from '@/pages/order/ContactList';
import ProductList from '@/pages/order/ProductList';
import { createOrder, deleteOrder, queryOrder, queryOrderById, revokeStockOrder, statistics, updateOrder } from '@/services/order';
import { copy } from '@/utils';
import {
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Drawer, Empty, Form, Input, message, Modal, Spin, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.module.less';

const PAGE_SIZE = 10;
const MOBILE_BATCH_STORAGE_KEY = 'mobile_batch_order_form_draft';

type MobileOrder = Order & {
  otherCost?: string | number;
};

type StatisticsInfo = {
  buyMoney: number;
  sellMoney: number;
  number: number;
  otherCost: number;
};

type MobileOrderConditions = {
  name?: string;
  contact?: string;
  startCreateDate?: string;
  endCreateDate?: string;
};

type MobileOrderProductDraft = {
  tmpId: number;
  name: string;
  buyPrice: string;
  sellPrice: string;
  number: string;
  otherCost: string;
};

const emptyStatistics: StatisticsInfo = {
  buyMoney: 0,
  sellMoney: 0,
  number: 0,
  otherCost: 0,
};

const createEmptyProduct = (): MobileOrderProductDraft => ({
  tmpId: Date.now() + Math.random(),
  name: '',
  buyPrice: '',
  sellPrice: '',
  number: '',
  otherCost: '',
});

const formatMoney = (value?: string | number) => Number(value || 0).toFixed(2);

const getOrderDate = (order: MobileOrder) => dayjs(order.orderTime || order.createTime).format('YYYY-MM-DD');

const getOrderProfit = (order: MobileOrder) => {
  return Decimal.mul(Number(order.sellPrice || 0), Number(order.number || 0))
    .minus(Decimal.mul(Number(order.buyPrice || 0), Number(order.number || 0)))
    .minus(Number(order.otherCost || 0))
    .toNumber();
};

const formatCopyText = (orders: MobileOrder[]) => {
  const result: string[] = [];
  let total = 0;

  orders.forEach((item) => {
    const sum = Math.round(Decimal.mul(parseFloat(item.sellPrice), parseFloat(`${item.number}`)).toNumber());
    total += sum;
    if (parseFloat(`${item.number}`) === 1) {
      result.push(`${item.name}：${sum}`);
    } else {
      result.push(`${item.name}：${item.number} * ${item.sellPrice} = ${sum}`);
    }
  });

  result.push(`总计：${total.toFixed(0)}`);
  return result.join('\n');
};

const toConditions = (values: {
  name?: string;
  contact?: string;
  createTime?: [Dayjs, Dayjs];
}): MobileOrderConditions => {
  const conditions: MobileOrderConditions = {
    name: values.name,
    contact: values.contact,
  };

  if (values.createTime) {
    conditions.startCreateDate = dayjs(values.createTime[0]).format('YYYY-MM-DD');
    conditions.endCreateDate = dayjs(values.createTime[1]).format('YYYY-MM-DD');
  }

  return conditions;
};

const isProductComplete = (product: MobileOrderProductDraft) => {
  return Boolean(product.name && product.buyPrice && product.sellPrice && product.number);
};

type EditDrawerProps = {
  id: number;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EditDrawer = ({ id, open, onClose, onSaved }: EditDrawerProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [oldData, setOldData] = useState<Partial<MobileOrder>>({});

  const loadData = async () => {
    if (!id || !open) return;
    setLoading(true);
    try {
      const data = (await queryOrderById(id)) as MobileOrder;
      setOldData(data);
      form.setFieldsValue({
        ...data,
        orderTime: data.orderTime ? dayjs(data.orderTime) : dayjs(data.createTime),
        phone: data.phone || '',
        address: data.address || '',
        remark: data.remark || '',
        otherCost: data.otherCost || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    form.setFieldsValue({
      name: product.name,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
    });
    setProductModalOpen(false);
  };

  const handleContactSelect = (contact: Contact) => {
    form.setFieldsValue({
      contact: contact.realname,
      phone: contact.phone || '',
      address: contact.address || '',
    });
    setContactModalOpen(false);
  };

  const handleSubmit = async (values: MobileOrder) => {
    await updateOrder({
      ...oldData,
      ...values,
      orderTime: dayjs(values.orderTime).format('YYYY-MM-DD'),
    } as Order);
    message.success('保存成功');
    onSaved();
  };

  useEffect(() => {
    loadData();
  }, [id, open]);

  return (
    <>
      <Drawer
        destroyOnClose
        rootClassName={styles.mobileDrawer}
        title="编辑订单"
        placement="right"
        width="100%"
        open={open}
        onClose={onClose}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="orderTime" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker allowClear={false} style={{ width: '100%' }} />
            </Form.Item>
            <div className={styles.formRow}>
              <Form.Item name="name" label="产品" rules={[{ required: true, message: '请输入产品名' }]}>
                <OrderProductInput />
              </Form.Item>
              <Button onClick={() => setProductModalOpen(true)}>选择</Button>
            </div>
            <div className={styles.formRow}>
              <Form.Item name="contact" label="客户" rules={[{ required: true, message: '请输入姓名' }]}>
                <OrderContactInput />
              </Form.Item>
              <Button onClick={() => setContactModalOpen(true)}>选择</Button>
            </div>
            <Form.Item name="phone" label="电话">
              <Input placeholder="请输入电话" />
            </Form.Item>
            <Form.Item name="address" label="地址">
              <Input placeholder="请输入地址" />
            </Form.Item>
            <Form.Item name="buyPrice" label="进价" rules={[{ required: true, message: '请输入进价' }]}>
              <Input inputMode="decimal" placeholder="请输入进价" />
            </Form.Item>
            <Form.Item name="sellPrice" label="售价" rules={[{ required: true, message: '请输入售价' }]}>
              <Input inputMode="decimal" placeholder="请输入售价" />
            </Form.Item>
            <Form.Item name="number" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
              <Input inputMode="decimal" placeholder="请输入数量" />
            </Form.Item>
            <Form.Item name="otherCost" label="其他费用">
              <Input inputMode="decimal" placeholder="请输入其他费用" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>
            <Button block size="large" type="primary" htmlType="submit">
              保存
            </Button>
          </Form>
        </Spin>
      </Drawer>

      <Modal destroyOnClose footer={null} title="选择产品" width="100%" open={productModalOpen} onCancel={() => setProductModalOpen(false)}>
        <ProductList onRowSelect={handleProductSelect} />
      </Modal>
      <Modal destroyOnClose footer={null} title="选择客户" width="100%" open={contactModalOpen} onCancel={() => setContactModalOpen(false)}>
        <ContactList onRowSelect={handleContactSelect} />
      </Modal>
    </>
  );
};

type BatchDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const BatchDrawer = ({ open, onClose, onSaved }: BatchDrawerProps) => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<MobileOrderProductDraft[]>([createEmptyProduct()]);
  const [editingTmpId, setEditingTmpId] = useState<number>(products[0].tmpId);
  const [submitting, setSubmitting] = useState(false);
  const [publicInfoExpanded, setPublicInfoExpanded] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [productPickerTmpId, setProductPickerTmpId] = useState<number>();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [cachedDraft, setCachedDraft] = useState<any>(null);
  const hasRestoredRef = useRef(false);

  const persistDraft = (nextProducts = products) => {
    if (!hasRestoredRef.current) return;
    const values = form.getFieldsValue();
    localStorage.setItem(
      MOBILE_BATCH_STORAGE_KEY,
      JSON.stringify({
        ...values,
        orderTime: values.orderTime ? dayjs(values.orderTime).format('YYYY-MM-DD') : undefined,
        products: nextProducts,
      }),
    );
  };

  const updateProducts = (updater: (value: MobileOrderProductDraft[]) => MobileOrderProductDraft[]) => {
    setProducts((value) => {
      const next = updater(value);
      persistDraft(next);
      return next;
    });
  };

  const handleProductChange = (tmpId: number, key: keyof MobileOrderProductDraft, value: string) => {
    updateProducts((items) => items.map((item) => (item.tmpId === tmpId ? { ...item, [key]: value } : item)));
  };

  const handleAddProduct = () => {
    const unfinished = products.find((item) => !isProductComplete(item));
    if (unfinished) {
      setEditingTmpId(unfinished.tmpId);
      message.warning('请先完成当前商品');
      return;
    }

    const next = createEmptyProduct();
    updateProducts((items) => [...items, next]);
    setEditingTmpId(next.tmpId);
  };

  const handleRemoveProduct = (tmpId: number) => {
    updateProducts((items) => {
      const next = items.filter((item) => item.tmpId !== tmpId);
      return next.length ? next : [createEmptyProduct()];
    });
  };

  const handleProductSelect = (product: Product) => {
    if (!productPickerTmpId) return;
    updateProducts((items) =>
      items.map((item) =>
        item.tmpId === productPickerTmpId
          ? {
              ...item,
              name: product.name,
              buyPrice: product.buyPrice,
              sellPrice: product.sellPrice,
            }
          : item,
      ),
    );
    setProductModalOpen(false);
  };

  const handleContactSelect = (contact: Contact) => {
    form.setFieldsValue({
      contact: contact.realname,
      phone: contact.phone || '',
      address: contact.address || '',
    });
    persistDraft();
    setContactModalOpen(false);
  };

  const clearDraft = () => {
    localStorage.removeItem(MOBILE_BATCH_STORAGE_KEY);
  };

  const restoreDraft = () => {
    if (cachedDraft) {
      const restoredProducts = cachedDraft.products?.length ? cachedDraft.products : [createEmptyProduct()];
      form.setFieldsValue({
        ...cachedDraft,
        orderTime: cachedDraft.orderTime ? dayjs(cachedDraft.orderTime) : dayjs(),
      });
      setProducts(restoredProducts);
      setEditingTmpId(restoredProducts[0].tmpId);
      message.success('草稿已恢复');
    }
    hasRestoredRef.current = true;
    setRestoreOpen(false);
  };

  const ignoreDraft = () => {
    clearDraft();
    form.resetFields();
    form.setFieldsValue({ orderTime: dayjs() });
    const next = createEmptyProduct();
    setProducts([next]);
    setEditingTmpId(next.tmpId);
    hasRestoredRef.current = true;
    setRestoreOpen(false);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const completedProducts = products.filter(isProductComplete);

    if (!completedProducts.length) {
      message.error('未添加产品信息');
      return;
    }

    if (completedProducts.length !== products.length) {
      const unfinished = products.find((item) => !isProductComplete(item));
      if (unfinished) setEditingTmpId(unfinished.tmpId);
      message.error('请补全商品信息');
      return;
    }

    setSubmitting(true);
    try {
      for (const product of completedProducts) {
        const { tmpId, ...productValues } = product;
        await createOrder({
          ...values,
          ...productValues,
          orderTime: dayjs(values.orderTime).format('YYYY-MM-DD'),
          status: '1',
          stockId: 0,
        } as Order);
      }
      clearDraft();
      message.success('保存成功');
      onSaved();
      ignoreDraft();
    } finally {
      setSubmitting(false);
    }
  };

  const totalProductAmount = products.reduce((total, product) => {
    return total + Number(product.sellPrice || 0) * Number(product.number || 0);
  }, 0);

  useEffect(() => {
    if (!open) return;
    hasRestoredRef.current = false;
    try {
      const savedDraft = localStorage.getItem(MOBILE_BATCH_STORAGE_KEY);
      if (savedDraft) {
        setCachedDraft(JSON.parse(savedDraft));
        setRestoreOpen(true);
      } else {
        form.setFieldsValue({ orderTime: dayjs() });
        hasRestoredRef.current = true;
      }
    } catch (e) {
      console.error('读取移动端批量草稿失败:', e);
      hasRestoredRef.current = true;
    }
  }, [open]);

  return (
    <>
      <Drawer
        destroyOnClose
        rootClassName={styles.mobileDrawer}
        title="批量新增订单"
        placement="right"
        width="100%"
        open={open}
        onClose={onClose}
        footer={
          <div className={styles.batchFooter}>
            <Button size="large" icon={<PlusOutlined />} onClick={handleAddProduct}>
              添加商品
            </Button>
            <Button size="large" type="primary" loading={submitting} onClick={handleSubmit}>
              提交 {products.filter(isProductComplete).length} 项
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onValuesChange={() => persistDraft()} className={styles.drawerBody}>
          <div className={styles.batchHeader}>
            <div>
              <strong>{products.length} 个商品</strong>
              <span>预计金额 {formatMoney(totalProductAmount)}</span>
            </div>
            <Button size="small" onClick={() => setPublicInfoExpanded((value) => !value)}>
              {publicInfoExpanded ? '收起信息' : '更多信息'}
            </Button>
          </div>

          <section className={styles.batchPublicPanel}>
            <div className={styles.batchInlineControls}>
              <Form.Item name="orderTime" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker allowClear={false} placeholder="日期" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="contact" rules={[{ required: true, message: '请输入姓名' }]}>
                <OrderContactInput placeholder="客户" />
              </Form.Item>
              <Button onClick={() => setContactModalOpen(true)}>选择</Button>
            </div>
            {publicInfoExpanded && (
              <div className={styles.morePublicInfo}>
                <Form.Item name="phone" label="电话">
                  <Input placeholder="请输入电话" />
                </Form.Item>
                <Form.Item name="address" label="地址">
                  <Input placeholder="请输入地址" />
                </Form.Item>
                <Form.Item name="remark" label="备注">
                  <Input.TextArea rows={2} placeholder="请输入备注" />
                </Form.Item>
              </div>
            )}
          </section>

          <div className={styles.productDrafts}>
            {products.map((product, index) => {
              const editing = product.tmpId === editingTmpId;
              const productAmount = Number(product.sellPrice || 0) * Number(product.number || 0);
              return (
                <div className={styles.draftCard} key={product.tmpId}>
                  <div className={styles.draftHeader}>
                    <div className={styles.draftTitle}>
                      <strong>{product.name || `商品 ${index + 1}`}</strong>
                      <span>
                        {isProductComplete(product)
                          ? `${product.number} * ${product.sellPrice}，其他费用 ${product.otherCost || 0}`
                          : '待补全商品信息'}
                      </span>
                    </div>
                    <div className={styles.productSummaryPrice}>
                      <span>小计</span>
                      <strong>{formatMoney(productAmount)}</strong>
                    </div>
                    <div className={styles.draftActions}>
                      <Button size="small" onClick={() => setEditingTmpId(product.tmpId)}>
                        编辑
                      </Button>
                      <Button
                        size="small"
                        danger
                        className={styles.deleteButton}
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveProduct(product.tmpId)}
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className={styles.productEditor}>
                      <div className={styles.productNoLabelRow}>
                        <Form.Item>
                          <OrderProductInput
                            placeholder="产品"
                            value={product.name}
                            onChange={(value) => handleProductChange(product.tmpId, 'name', value)}
                          />
                        </Form.Item>
                        <Button
                          onClick={() => {
                            setProductPickerTmpId(product.tmpId);
                            setProductModalOpen(true);
                          }}
                        >
                          选择
                        </Button>
                      </div>
                      <div className={styles.productFieldGrid}>
                        <Form.Item required>
                          <Input
                            inputMode="decimal"
                            placeholder="进价"
                            value={product.buyPrice}
                            onChange={(event) => handleProductChange(product.tmpId, 'buyPrice', event.target.value)}
                          />
                        </Form.Item>
                        <Form.Item required>
                          <Input
                            inputMode="decimal"
                            placeholder="售价"
                            value={product.sellPrice}
                            onChange={(event) => handleProductChange(product.tmpId, 'sellPrice', event.target.value)}
                          />
                        </Form.Item>
                        <Form.Item required>
                          <Input
                            inputMode="decimal"
                            placeholder="数量"
                            value={product.number}
                            onChange={(event) => handleProductChange(product.tmpId, 'number', event.target.value)}
                          />
                        </Form.Item>
                        <Form.Item>
                          <Input
                            inputMode="decimal"
                            placeholder="其他费用"
                            value={product.otherCost}
                            onChange={(event) => handleProductChange(product.tmpId, 'otherCost', event.target.value)}
                          />
                        </Form.Item>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Form>
      </Drawer>

      <Modal destroyOnClose footer={null} title="选择产品" width="100%" open={productModalOpen} onCancel={() => setProductModalOpen(false)}>
        <ProductList onRowSelect={handleProductSelect} />
      </Modal>
      <Modal destroyOnClose footer={null} title="选择客户" width="100%" open={contactModalOpen} onCancel={() => setContactModalOpen(false)}>
        <ContactList onRowSelect={handleContactSelect} />
      </Modal>
      <Modal title="恢复草稿" open={restoreOpen} onOk={restoreDraft} onCancel={ignoreDraft} okText="恢复" cancelText="忽略" centered>
        <p>检测到上次有未提交的移动端批量订单数据，是否恢复？</p>
      </Modal>
    </>
  );
};

export default () => {
  const [filterForm] = Form.useForm();
  const [conditions, setConditions] = useState<MobileOrderConditions>({});
  const [orders, setOrders] = useState<MobileOrder[]>([]);
  const [statisticsInfo, setStatisticsInfo] = useState<StatisticsInfo>(emptyStatistics);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [editId, setEditId] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);

  const selectedOrders = useMemo(() => orders.filter((order) => selectedIds.includes(order.id || 0)), [orders, selectedIds]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadData = async (nextConditions = conditions, nextCurrent = current) => {
    setLoading(true);
    try {
      const [orderResult, statisticsResult] = await Promise.all([
        queryOrder({
          ...nextConditions,
          current: nextCurrent,
          pageSize: PAGE_SIZE,
        }),
        statistics(nextConditions),
      ]);
      const result = orderResult as any;
      setOrders(result.content || []);
      setTotal(result.total || 0);
      setStatisticsInfo((statisticsResult as StatisticsInfo) || emptyStatistics);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (values: any) => {
    const nextConditions = toConditions(values);
    setConditions(nextConditions);
    setCurrent(1);
    setFilterOpen(false);
    loadData(nextConditions, 1);
  };

  const refreshCurrentPage = () => {
    loadData(conditions, current);
  };

  const handleCopyClick = () => {
    if (!selectedOrders.length) {
      message.warning('未选择要复制的数据');
      return;
    }
    copy(formatCopyText(selectedOrders));
    message.success('复制成功');
  };

  const handleDelete = (order: MobileOrder) => {
    Modal.confirm({
      title: '删除订单',
      content: `确认删除“${order.name}”？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteOrder(order.id || 0);
        message.success('删除成功');
        refreshCurrentPage();
      },
    });
  };

  const handleRevoke = (order: MobileOrder) => {
    Modal.confirm({
      title: '撤销出库',
      content: `确认撤销“${order.name}”的库存出库？`,
      okText: '撤销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await revokeStockOrder(order.id || 0);
        message.success('撤销库存订单成功');
        refreshCurrentPage();
      },
    });
  };

  const changePage = (next: number) => {
    setCurrent(next);
    loadData(conditions, next);
    scrollToPageTop();
  };

  const scrollToPageTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    loadData({}, 1);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>订单录入</h1>
          <span>移动端批量录单与查询</span>
        </div>
        <div className={styles.headerActions}>
          <Button aria-label="筛选" icon={<FilterOutlined />} onClick={() => setFilterOpen(true)} />
          <Button aria-label="复制" icon={<CopyOutlined />} onClick={handleCopyClick} />
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.summaryPanel}>
          <button className={styles.summaryToggle} type="button" onClick={() => setSummaryCollapsed((value) => !value)}>
            <span>汇总</span>
            <strong>{formatMoney(statisticsInfo.sellMoney - statisticsInfo.buyMoney - statisticsInfo.otherCost)}</strong>
            {summaryCollapsed ? <DownOutlined /> : <UpOutlined />}
          </button>
          {!summaryCollapsed && (
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span>总成本</span>
                <strong>{formatMoney(statisticsInfo.buyMoney)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>总售价</span>
                <strong>{formatMoney(statisticsInfo.sellMoney)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>其他费用</span>
                <strong>{formatMoney(statisticsInfo.otherCost)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>总利润</span>
                <strong>{formatMoney(statisticsInfo.sellMoney - statisticsInfo.buyMoney - statisticsInfo.otherCost)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>总数量</span>
                <strong>{Number(statisticsInfo.number || 0).toFixed(1)}</strong>
              </div>
            </div>
          )}
        </section>

        <div className={styles.toolbar}>
          <span>共 {total} 条</span>
          <span>已选 {selectedOrders.length} 条</span>
        </div>

        <Spin spinning={loading}>
          {orders.length ? (
            <section className={styles.list}>
              {orders.map((order) => {
                const checked = selectedIds.includes(order.id || 0);
                return (
                  <article className={`${styles.orderCard} ${checked ? styles.orderCardSelected : ''}`} key={order.id}>
                    <div className={styles.cardTop}>
                      <Checkbox
                        checked={checked}
                        onChange={(event) => {
                          const id = order.id || 0;
                          setSelectedIds((value) => (event.target.checked ? [...value, id] : value.filter((item) => item !== id)));
                        }}
                      />
                      <div>
                        <h2 className={styles.productName}>{order.name}</h2>
                        <div className={styles.meta}>
                          <span>{order.contact}</span>
                          <span>{getOrderDate(order)}</span>
                          {order.stockId ? <span>库存订单</span> : <span>普通订单</span>}
                        </div>
                      </div>
                      <div className={styles.profit}>
                        <span>利润</span>
                        <strong>{formatMoney(getOrderProfit(order))}</strong>
                      </div>
                    </div>
                    <div className={styles.priceGrid}>
                      <div className={styles.priceItem}>
                        <span>售价</span>
                        <strong>{formatMoney(order.sellPrice)}</strong>
                      </div>
                      <div className={styles.priceItem}>
                        <span>数量</span>
                        <strong>{order.number}</strong>
                      </div>
                      <div className={styles.priceItem}>
                        <span>其他费用</span>
                        <strong>{formatMoney(order.otherCost)}</strong>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <Button size="small" icon={<EditOutlined />} onClick={() => setEditId(order.id || 0)}>
                        编辑
                      </Button>
                      {order.stockId ? (
                        <Button size="small" danger onClick={() => handleRevoke(order)}>
                          撤销出库
                        </Button>
                      ) : (
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(order)}>
                          删除
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className={styles.empty}>
              <Empty description="暂无订单" />
            </div>
          )}
        </Spin>

        <div className={styles.pager}>
          <Button disabled={current <= 1 || loading} onClick={() => changePage(current - 1)}>
            上一页
          </Button>
          <span>
            {current} / {totalPages}
          </span>
          <Button disabled={current >= totalPages || loading} onClick={() => changePage(current + 1)}>
            下一页
          </Button>
        </div>
      </main>

      <div className={styles.bottomBar}>
        <Button size="large" icon={<CopyOutlined />} onClick={handleCopyClick}>
          复制
        </Button>
        <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => setBatchOpen(true)}>
          批量新增
        </Button>
      </div>

      <Drawer
        rootClassName={styles.mobileDrawer}
        title="筛选"
        placement="right"
        width="100%"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      >
        <Form form={filterForm} layout="vertical" onFinish={handleFilterSubmit}>
          <Form.Item label="品名" name="name">
            <OrderProductInput placeholder="商品名称" />
          </Form.Item>
          <Form.Item label="姓名" name="contact">
            <OrderContactInput placeholder="客户姓名" />
          </Form.Item>
          <Form.Item label="日期" name="createTime">
            <DateRangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block size="large" type="primary" htmlType="submit">
              查询
            </Button>
            <Button
              block
              onClick={() => {
                filterForm.resetFields();
                handleFilterSubmit({});
              }}
            >
              重置
            </Button>
          </Space>
        </Form>
      </Drawer>

      <EditDrawer
        id={editId}
        open={!!editId}
        onClose={() => setEditId(0)}
        onSaved={() => {
          setEditId(0);
          refreshCurrentPage();
        }}
      />
      <BatchDrawer
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onSaved={() => {
          setBatchOpen(false);
          setCurrent(1);
          loadData(conditions, 1);
        }}
      />
    </div>
  );
};
