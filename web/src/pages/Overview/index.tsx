import React, { useState } from 'react'
import { Table, Form, Input, Button, Space } from 'antd'
import { SearchForm } from "@/components"
import { useTable } from '@/hooks'
import styles from "./index.module.less"
import { queryOrder } from '@/services/order'

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading } = useTable<Order>({ conditions, request: queryOrder })

    const columns = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
        },
        {
            title: '住址',
            dataIndex: 'address',
            key: 'address',
        },
    ];

    const handleFormSearch = (values: any) => {
        console.log(values);
    }

    return <div>
        <SearchForm>
            <Form onFinish={handleFormSearch} layout="inline">
                <Form.Item label="品名" name="goodsName">
                    <Input />
                </Form.Item>
                <Form.Item label="客户名字" name="contaceName">
                    <Input />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button htmlType='submit' type="primary">查询</Button>
                        <Button >新增</Button>
                    </Space>
                </Form.Item>
            </Form>
        </SearchForm>
        <div className={styles.tableWrapper}>
            <Table loading={loading} dataSource={dataSource} columns={columns} />
        </div>
    </div>
}