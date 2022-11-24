import { SearchForm, TextButton } from "@/components"
import { useTable } from '@/hooks'
import { deleteOrder, queryOrder, changeOrderStatus } from "@/services/order"
import { Button, Form, Input, message, Modal, Space, Table, DatePicker, Select } from 'antd'
import { useState } from 'react'
import EditPage from "./Edit"
import { STATUS, translateToArray } from "@/data"
import dayjs from "dayjs"
import styles from "./index.module.less"

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, searchForm } = useTable<Order>({ request: queryOrder, conditions })
    const [modalOptions, setModalOptions] = useState({ id: "", open: false })

    const handleOrderDelete = async (id: string) => {
        await deleteOrder(id)
        message.success("删除成功")
        searchForm()
    }

    const handleOrderStatusChange = async (id: string, status: string) => {
        await changeOrderStatus(id, status)
        message.success("修改成功")
        searchForm()
    }

    const handleFormSearch = (values: any) => {
        values = {
            ...values,
            createTime: dayjs(values.createTime).format("YYYY-MM-DD")
        }
        setConditions(values);
    }

    const handleAfterCreate = () => {
        setModalOptions({ id: "", open: false })
        searchForm()
    }

    const handleEditClick = (id: string) => {
        setModalOptions({ id, open: true });
    }

    const columns = [
        {
            title: '产品名',
            dataIndex: 'name',
        },
        {
            title: '姓名',
            dataIndex: 'contact',
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
            title: '备注',
            dataIndex: 'remark',
        },
        {
            title: '日期',
            dataIndex: 'createTime',
        },
        {
            title: '状态',
            dataIndex: 'status',
            render(status: string) {
                return <span className={styles.status} data-status={status}>{translateToArray("STATUS")[status]}</span>
            }
        },
        {
            title: '操作',
            key: "operation",
            width: "200px",
            render: (record: Order) => (
                <Space size="middle">
                    <TextButton onClick={() => handleEditClick(record.id as string)}>编辑</TextButton>
                    {
                        record.status == "1" ?
                            <TextButton onClick={() => handleOrderStatusChange(record.id as string, "2")}>已完成</TextButton> :
                            <TextButton onClick={() => handleOrderStatusChange(record.id as string, "1")}>未完成</TextButton>
                    }
                    <TextButton onClick={() => handleOrderDelete(record.id as string)}>删除</TextButton>
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
                <Form.Item label="姓名" name="contact">
                    <Input allowClear />
                </Form.Item>
                <Form.Item label="日期" name="createTime">
                    {/* <DatePicker.RangePicker allowClear placeholder={["起始日期", "结束日期"]} /> */}
                    <DatePicker placeholder="订单日期" allowClear />
                </Form.Item>
                <Form.Item label="状态" name="status">
                    <Select allowClear options={STATUS} placeholder="订单状态" />
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
        </SearchForm >
        <div className={styles.tableWrapper}>
            <Table rowKey="id" loading={loading} dataSource={dataSource} columns={columns} />
        </div>

        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: "", open: false })} >
            <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
        </Modal>
    </div >
}

