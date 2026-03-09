import { DateRangePicker, OrderContactInput, OrderProductInput, SearchForm, TextButton, Table } from '@/components';
import { useTable } from '@/hooks';
import { deleteOrder, queryOrder, revokeStockOrder, statistics } from '@/services/order';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Descriptions, FloatButton, Form, message, Modal, Space } from 'antd';
import { useEffect, useState } from 'react';
import BatchCreate from './BatchCreate';
import EditPage from './Edit';
import { copy } from '@/utils';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import styles from './index.module.less';
import { Order } from '@/global';

interface ContactInfo {
  contact?: string;
  phone?: string;
  address?: string;
}

interface Statistics {
  buyMoney: number;
  sellMoney: number;
  number: number;
  otherCost: number;
}

export default () => {
  const [conditions, setConditions] = useState({});
  const { dataSource, loading, searchForm, pagination, handlePageChange } = useTable<Order>({
    request: queryOrder,
    conditions,
  });
  const [modalOptions, setModalOptions] = useState({
    id: 0,
    open: false,
  });
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedDataStr, setSelectDataStr] = useState('');
  const [contactOptions, setContactOptions] = useState<{
    data: ContactInfo;
    open: boolean;
  }>({
    data: {},
    open: false,
  });
  const [statisticsInfo, setStatisticsInfo] = useState<Statistics>({
    sellMoney: 0,
    buyMoney: 0,
    number: 0,
    otherCost: 0,
  });

  const queryStatistics = async (innerConditions?: any) => {
    const result = await statistics(innerConditions ?? conditions);
    setStatisticsInfo(result as Statistics);
  };

  const handleSearchForm = () => {
    searchForm();
    queryStatistics();
  };

  const handleOrderDelete = async (id = 0) => {
    await deleteOrder(id);
    message.success('删除成功');
    handleSearchForm();
  };

  const handleCopyClick = () => {
    if (!selectedDataStr) {
      message.warning('未选择要复制的数据');
      return;
    }
    copy(selectedDataStr);
    message.success('复制成功');
  };

  const handleFormSearch = (values: any) => {
    const { createTime, ...restValues } = values;
    let newConditions = restValues;

    if (createTime) {
      newConditions = {
        ...restValues,
        startCreateDate: dayjs(createTime[0]).format('YYYY-MM-DD'),
        endCreateDate: dayjs(createTime[1]).format('YYYY-MM-DD'),
      };
    }

    setConditions(newConditions);
    queryStatistics(newConditions);
  };

  const handleAfterCreate = () => {
    setModalOptions({
      id: 0,
      open: false,
    });
    handleSearchForm();
  };

  const handleAfterBatchCreate = () => {
    setBatchModalOpen(false);
    handleSearchForm();
  };

  const handleEditClick = (id = 0) => {
    setModalOptions({
      id,
      open: true,
    });
  };

  const handleRevokeOutStock = async (order: Order) => {
    await revokeStockOrder(order.id ?? 0);
    handleSearchForm();
    message.success('撤销库存订单成功');
  };

  const columns = [
    {
      title: '产品名',
      dataIndex: 'name',
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'contact',
      render: (text: string, record: ContactInfo) => (
        <TextButton
          onClick={() =>
            setContactOptions({
              open: true,
              data: record,
            })
          }
        >
          {text}
        </TextButton>
      ),
    },
    {
      title: '进价',
      dataIndex: 'buyPrice',
    },
    {
      title: '售价',
      dataIndex: 'sellPrice',
    },
    {
      title: '数量',
      dataIndex: 'number',
    },
    {
      title: '其他费用',
      dataIndex: 'otherCost',
      render: (text: number) => text || '-',
    },
    {
      title: '利润',
      dataIndex: 'number',
      render: (text: string, record: any) => {
        return (
          <>
            {parseFloat(
              `${record.sellPrice * record.number - record.buyPrice * record.number - record.otherCost}`,
            ).toFixed(2)}
          </>
        );
      },
    },
    // {
    //     title: '备注',
    //     dataIndex: 'remark',
    //     render: (text: string) => text || "-"
    // },
    {
      title: '日期',
      dataIndex: 'orderTime',
      width: 140,
      render: (text: string, record: Order) => dayjs(text || record.createTime).format('YYYY-MM-DD'),
    },
    // {
    //   title: "状态",
    //   dataIndex: "status",
    //   width: 80,
    //   render(status: string) {
    //     return (
    //       <span className={styles.status} data-status={status}>
    //         {translateToArray("STATUS")[status]}
    //       </span>
    //     );
    //   },
    // },
    {
      title: '操作',
      key: 'operation',
      width: 180,
      render: (_: any, record: Order) => (
        <Space size="middle">
          <TextButton onClick={() => handleEditClick(record.id)}>编辑</TextButton>
          {record.stockId ? (
            <TextButton
              onClick={() => {
                handleRevokeOutStock(record);
              }}
              danger
            >
              撤销出库
            </TextButton>
          ) : (
            <TextButton
              onClick={() => {
                handleOrderDelete(record.id);
              }}
              danger
            >
              删除
            </TextButton>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Order[]) => {
      const result: string[] = [];
      let total = 0;
      selectedRows.map((item) => {
        let sum = 0;
        sum += Math.round(Decimal.mul(parseFloat(item.sellPrice), parseFloat(item.number + '')).toNumber());
        total += sum;
        if (parseFloat(item.number) == 1) {
          result.push(`${item.name}：${sum}`);
        } else {
          result.push(`${item.name}：${item.number} * ${item.sellPrice} = ${sum}`);
        }
      });
      result.push(`总计：${total.toFixed(0)}`);
      setSelectDataStr(result.join('\n'));
    },
  };

  useEffect(() => {
    queryStatistics();
  }, []);

  return (
    <div>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="品名" name="name" className={styles.searchInput}>
            <OrderProductInput placeholder="商品名称" />
          </Form.Item>
          <Form.Item label="姓名" name="contact" className={styles.searchInput}>
            <OrderContactInput placeholder="客户姓名" />
          </Form.Item>
          <Form.Item label="日期" name="createTime">
            <DateRangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button htmlType="submit" type="primary">
                查询
              </Button>
              <Button type="primary" onClick={() => setBatchModalOpen(true)}>
                批量新增
              </Button>
              <Button type="primary" onClick={handleCopyClick}>
                复制
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SearchForm>
      <SearchForm>
        <div>
          汇总：
          <Space size="large">
            <span>
              总成本：
              {parseFloat(`${statisticsInfo.buyMoney}`).toFixed(2)}
            </span>
            <span>
              总售价：
              {parseFloat(`${statisticsInfo.sellMoney}`).toFixed(2)}
            </span>
            <span>
              其他费用：
              {parseFloat(`${statisticsInfo.otherCost}`).toFixed(2)}
            </span>
            <span>
              总利润：
              {parseFloat(`${statisticsInfo.sellMoney - statisticsInfo.buyMoney - statisticsInfo.otherCost}`).toFixed(
                2,
              )}
            </span>
            <span>
              总数量：
              {parseFloat(`${statisticsInfo.number}`).toFixed(1)}
            </span>
          </Space>
        </div>
      </SearchForm>

      <div className={styles.tableWrapper}>
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          shape="circle"
          onClick={() => {
            setModalOptions({
              id: 0,
              open: true,
            });
          }}
        />
        <Table<Order>
          rowSelection={{
            type: 'checkbox',
            ...rowSelection,
          }}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handlePageChange}
          dataSource={dataSource}
          columns={columns}
        />
      </div>

      <Modal
        destroyOnClose
        footer={null}
        title={modalOptions.id ? '编辑' : '新增'}
        open={modalOptions.open}
        onCancel={() =>
          setModalOptions({
            id: 0,
            open: false,
          })
        }
      >
        <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
      </Modal>

      <Modal
        destroyOnClose
        footer={null}
        title={'批量新增'}
        open={batchModalOpen}
        width={1000}
        onCancel={() => setBatchModalOpen(false)}
      >
        <BatchCreate onSubmit={handleAfterBatchCreate} />
      </Modal>

      <Modal
        open={contactOptions.open}
        cancelText="asd"
        onCancel={() =>
          setContactOptions({
            open: false,
            data: {},
          })
        }
        destroyOnClose
        title="客户信息"
        footer={
          <Button
            onClick={() =>
              setContactOptions({
                open: false,
                data: {},
              })
            }
          >
            确定
          </Button>
        }
      >
        <Descriptions column={1}>
          <Descriptions.Item label="姓名">{contactOptions.data.contact}</Descriptions.Item>
          <Descriptions.Item label="电话">{contactOptions.data.phone}</Descriptions.Item>
          <Descriptions.Item label="地址">{contactOptions.data.address}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};
