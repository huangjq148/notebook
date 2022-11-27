import { SearchForm } from "@/components"
import { useTable } from '@/hooks'
import { deleteProduct, queryProduct } from "@/services/product"
import { Button, Form, Input, message, Modal, Space, Table } from 'antd'
import { useState } from 'react'
import { TextButton } from "@/components"
import EditPage from "@/pages/Product/Edit"
import styles from "./index.module.less"

type Props = {
    onRowSelect: (val: Product) => void
}

export default (props: Props) => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, searchForm } = useTable<Product>({ request: queryProduct, conditions })
    const [modalOptions, setModalOptions] = useState({ id: "", open: false })

    const handleProductDelete = async (id: string) => {
        await deleteProduct(id)
        message.success("删除成功")
        searchForm()
    }

    const handleRowSelect = (record: Product) => {
        props.onRowSelect(record)
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
            width: "160px",
            render: (record: Product) => (
                <Space size="middle">
                    <TextButton onClick={() => handleRowSelect(record)}>选中</TextButton>
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
            <Table rowKey="id"
                size="small" loading={loading} dataSource={dataSource} columns={columns} />
        </div>

        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: "", open: false })} >
            <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
        </Modal>
    </div >
}