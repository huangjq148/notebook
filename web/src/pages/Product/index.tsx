import React, { useEffect, useState } from 'react'
import { Table, Form, Input, Button, Space, Modal, message } from 'antd'
import { SearchForm } from "@/components"
import { useTable } from '@/hooks'
import { queryProduct, deleteProduct } from "@/services/product"
import EditPage from "./Edit"
import styles from "./index.module.less"

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, searchForm } = useTable<Product>({ request: queryProduct, conditions })
    const [modalOptions, setModalOptions] = useState({ id: "", open: false })

    const handleProductDelete = async (id: string) => {
        await deleteProduct(id)
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
            title: '操作',
            key: "operation",
            render: (record: Product) => <Button type="text" onClick={() => handleProductDelete(record.id as string)}>删除</Button>
        },
    ];

    const handleFormSearch = (values: any) => {
        console.log(values);
        searchForm()
    }

    const handleAfterCreate = () => {
        setModalOptions({ id: "", open: false })
        searchForm()
    }


    return <div>
        <SearchForm>
            <Form onFinish={handleFormSearch} layout="inline">
                <Form.Item label="商品名" name="name">
                    <Input />
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
            <Table loading={loading} dataSource={dataSource} columns={columns} />
        </div>

        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: "", open: false })} >
            <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
        </Modal>
    </div >
}