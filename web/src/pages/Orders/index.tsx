import { SearchForm, TextButton } from "@/components"
import { useTable } from '@/hooks'
import { deleteOrder, queryOrder, changeOrderStatus, statistics } from "@/services/order"
import { Button, Form, Input, message, Modal, Space, Table, DatePicker, Select, Descriptions } from 'antd'
import { useEffect, useState } from 'react'
import EditPage from "./Edit"
import { STATUS, translateToArray } from "@/data"
import dayjs from "dayjs"
import styles from "./index.module.less"

interface ContactInfo { contact?: string, phone?: string, address?: string }

interface Statistics { buyPrice: number, sellPrice: number, number: number }

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, searchForm } = useTable<Order>({ request: queryOrder, conditions })
    const [modalOptions, setModalOptions] = useState({ id: "", open: false })
    const [contactOptions, setContactOptions] = useState<{ data: ContactInfo, open: boolean }>({ data: {}, open: false })
    const [statisticsInfo, setStatisticsInfo] = useState<Partial<Statistics>>({})

    const queryStatistics = async () => {
        const result = await statistics(conditions)
        setStatisticsInfo(result as Statistics)
    }

    const handleSearchForm = () => {
        searchForm()
        queryStatistics()
    }
    const handleOrderDelete = async (id: string) => {
        await deleteOrder(id)
        message.success("删除成功")
        handleSearchForm()
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
        queryStatistics()
    }

    const handleAfterCreate = () => {
        setModalOptions({ id: "", open: false })
        handleSearchForm()
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
            render: (text: string, record: ContactInfo) => <TextButton onClick={() => setContactOptions({ open: true, data: record })}>{text}</TextButton>
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
            render: (text: string) => text || "-"
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

    useEffect(() => {
        queryStatistics()
    }, [])

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
                    <Select allowClear options={STATUS} placeholder="请选择" />
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
        <SearchForm>
            <div>汇总：总金额：{statisticsInfo.buyPrice}，总成本：{statisticsInfo.sellPrice}，总利润：{statisticsInfo.sellPrice - statisticsInfo.buyPrice}，总数量：{statisticsInfo.number}</div>
        </SearchForm>
        <div className={styles.tableWrapper}>
            <Table rowKey="id" loading={loading} dataSource={dataSource} columns={columns} />
        </div>
        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: "", open: false })} >
            <EditPage onSubmit={handleAfterCreate} id={modalOptions.id} />
        </Modal>
        <Modal open={contactOptions.open} footer={null} cancelText="asd" onCancel={() => setContactOptions({ open: false, data: {} })} destroyOnClose title="客户信息">
            <Descriptions column={1}>
                <Descriptions.Item label="姓名">{contactOptions.data.contact}</Descriptions.Item>
                <Descriptions.Item label="电话">{contactOptions.data.phone}</Descriptions.Item>
                <Descriptions.Item label="地址">{contactOptions.data.address}</Descriptions.Item>
            </Descriptions>
            <Button onClick={() => setContactOptions({ open: false, data: {} })}>确定</Button>
        </Modal>
    </div >
}

