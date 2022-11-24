import { SearchForm, TextButton } from "@/components"
import { useTable } from '@/hooks'
import { deleteStock, queryStock } from "@/services/stock"
import { Button, Form, Input, message, Modal, Space, Table } from 'antd'
import { useState } from 'react'
import EditPage from "./Edit"
import styles from "./index.module.less"

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, searchForm } = useTable<Product>({ request: queryStock, conditions })
    const [modalOptions, setModalOptions] = useState({ id: "", open: false })

    const handleProductDelete = async (id: string) => {
        await deleteStock(id)
        message.success("删除成功")
        searchForm()
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
            render: (record: Product) => (
                <Space size="middle">
                    <TextButton onClick={() => handleProductDelete(record.id as string)}>出货</TextButton>
                    <TextButton onClick={() => handleEditClick(record.id as string)}>编辑</TextButton>
                    <TextButton onClick={() => handleProductDelete(record.id as string)}>删除</TextButton>
                </Space>
            )
        },
    ];

    const handleFormSearch = (values: any) => {
        setConditions(values);
    }

    const handleAfterCreate = () => {
        setModalOptions({ id: "", open: false })
        searchForm()
    }

    const handleEditClick = (id: string) => {
        setModalOptions({ id, open: true });
    }

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
                            setModalOptions({ id: "", open: true })
                        }}>新增</Button>
                    </Space>
                </Form.Item>
            </Form>
        </SearchForm>
        <div className={styles.tableWrapper}>
            <Table rowKey="id" loading={loading} dataSource={dataSource} columns={columns} />
        </div>

        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: "", open: false })} >
            <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
        </Modal>
    </div >
}