import { DeleteConfirmButton, OrderProductInput, SearchForm, TextButton } from '@/components';
import { useTable } from '@/hooks';
import StockSell from '@/pages/order/Edit';
import { deleteStock, queryStock, statistics } from '@/services/stock';
import { Button, Form, message, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import EditPage from './Edit';
import styles from './index.module.less';

import { Product, Stock } from '@/global.d';

interface Statistics {
  buyMoney: number;
  sellMoney: number;
  number: number;
}

export default () => {
  const [conditions, setConditions] = useState({});
  const { dataSource, loading, pagination, searchForm, handlePageChange } = useTable<Product>({
    request: queryStock,
    conditions,
  });
  const [modalOptions, setModalOptions] = useState({
    id: 0,
    open: false,
  });
  const [outStockModal, setOutStockModal] = useState<{
    open: boolean;
    data: Partial<Stock>;
  }>({
    open: false,
    data: {},
  });
  const [statisticsInfo, setStatisticsInfo] = useState<Statistics>({
    sellMoney: 0,
    buyMoney: 0,
    number: 0,
  });

  const handleProductDelete = async (id: number) => {
    await deleteStock(id);
    message.success('删除成功');
    searchForm();
    queryStatistics();
  };

  const handleFormSearch = (values: any) => {
    setConditions(values);
    queryStatistics(values);
  };

  const handleAfterCreate = () => {
    setModalOptions({
      id: 0,
      open: false,
    });
    queryStatistics();
    searchForm();
  };

  const queryStatistics = async (innerConditions?: any) => {
    const result = await statistics(innerConditions ?? conditions);
    setStatisticsInfo(result as Statistics);
  };

  const handleAfterOutStock = () => {
    setOutStockModal({
      open: false,
      data: {},
    });
    searchForm();
  };

  const handleEditClick = (id: number) => {
    setModalOptions({
      id,
      open: true,
    });
  };

  const handleStockSell = (stock: Stock) => {
    setOutStockModal({
      open: true,
      data: stock,
    });
  };

  useEffect(() => {
    queryStatistics();
  }, []);

  const columns = [
    {
      title: '产品名',
      dataIndex: 'name',
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
      title: '库存',
      dataIndex: 'number',
    },
    {
      title: '操作',
      key: 'operation',
      width: '200px',
      render: (record: Stock) => (
        <Space size="middle">
          <TextButton onClick={() => handleStockSell(record)}>出货</TextButton>
          <TextButton onClick={() => handleEditClick(record.id ?? 0)}>编辑</TextButton>
          <TextButton onClick={() => handleProductDelete(record.id ?? 0)}>删除</TextButton>
          {/* <DeleteConfirmButton
            onConfirm={() => {
              handleProductDelete(record.id ?? 0);
            }}
          >
            <TextButton>删除</TextButton>
          </DeleteConfirmButton> */}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <SearchForm>
        <Form onFinish={handleFormSearch} layout="inline">
          <Form.Item label="品名" name="name" className={styles.searchInput}>
            <OrderProductInput allowClear placeholder="产品名称" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button htmlType="submit" type="primary">
                查询
              </Button>
              <Button
                onClick={() => {
                  setModalOptions({
                    id: 0,
                    open: true,
                  });
                }}
              >
                新增
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
              总利润：
              {parseFloat(`${statisticsInfo.sellMoney - statisticsInfo.buyMoney}`).toFixed(2)}
            </span>
          </Space>
        </div>
      </SearchForm>
      <div className={styles.tableWrapper}>
        <Table
          rowKey="id"
          loading={loading}
          pagination={pagination}
          dataSource={dataSource}
          onChange={handlePageChange}
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
        title="出库"
        footer={null}
        destroyOnClose
        open={outStockModal.open}
        onCancel={() =>
          setOutStockModal({
            open: false,
            data: {},
          })
        }
      >
        <StockSell onSubmit={handleAfterOutStock} stockInfo={outStockModal.data} />
      </Modal>
    </div>
  );
};
