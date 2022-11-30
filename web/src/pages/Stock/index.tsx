import { SearchForm, TextButton } from "@/components"
import { useTable } from '@/hooks'
import { deleteStock, queryStock } from "@/services/stock"
import { Button, Form, Input, message, Modal, Space, Table } from 'antd'
import { useState } from 'react'
import EditPage from "./Edit"
import styles from "./index.module.less"
import StockSell from "@/pages/Orders/Edit"

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, pagination, searchForm } = useTable<Product>({ request: queryStock, conditions })
    const [modalOptions, setModalOptions] = useState({ id: 0, open: false })
    const [outStockModal, setOutStockModal] = useState<{ open: boolean, data: Partial<Stock> }>({ open: false, data: {} })

    const handleProductDelete = async (id: number) => {
        await deleteStock(id)
        message.success("删除成功")
        searchForm()
    }

    const handleFormSearch = (values: any) => {
        setConditions(values);
    }

    const handleAfterCreate = () => {
        setModalOptions({ id: 0, open: false })
        searchForm()
    }

    const handleAfterOutStock = () => {
        setOutStockModal({ open: false, data: {} })
        searchForm()
    }

    const handleEditClick = (id: number) => {
        setModalOptions({ id, open: true });
    }

    const handleStockSell = (stock: Stock) => {
        setOutStockModal({ open: true, data: stock })
    }

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
            key: "operation",
            width: "200px",
            render: (record: Stock) => (
                <Space size="middle">
                    <TextButton onClick={() => handleStockSell(record)}>出货</TextButton>
                    <TextButton onClick={() => handleEditClick(record.id ?? 0)}>编辑</TextButton>
                    <TextButton onClick={() => handleProductDelete(record.id ?? 0)}>删除</TextButton>
                </Space>
            )
        },
    ];

    return <div>
        <SearchForm>
            <Form onFinish={handleFormSearch} layout="inline">
                <Form.Item label="品名" name="name">
                    <Input allowClear />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button htmlType='submit' type="primary">查询</Button>
                        <Button onClick={() => {
                            setModalOptions({ id: 0, open: true })
                        }}>新增</Button>
                    </Space>
                </Form.Item>
            </Form>
        </SearchForm>
        <div className={styles.tableWrapper}>
            <Table rowKey="id" loading={loading} pagination={pagination} dataSource={dataSource} columns={columns} />
        </div>

        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: 0, open: false })} >
            <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
        </Modal>

        <Modal title="出库" footer={null} open={outStockModal.open} onCancel={() => setOutStockModal({ open: false, data: {} })}>
            <StockSell onSubmit={handleAfterOutStock} stockInfo={outStockModal.data} />
        </Modal>
    </div >
}