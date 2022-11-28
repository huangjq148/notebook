import { SearchForm, TextButton } from "@/components"
import { useTable } from '@/hooks'
import { deleteOrder, queryOrder, changeOrderStatus, statistics, revokeStockOrder } from "@/services/order"
import { Button, Form, Input, message, Modal, Space, Table, DatePicker, Select, Descriptions } from 'antd'
import { useEffect, useState } from 'react'
import EditPage from "./Edit"
import { STATUS, translateToArray } from "@/data"
import dayjs from "dayjs"
import styles from "./index.module.less"

interface ContactInfo { contact?: string, phone?: string, address?: string }

interface Statistics { buyMoney: number, sellMoney: number, number: number }

export default () => {
    const [conditions, setConditions] = useState({})
    const { dataSource, loading, searchForm } = useTable<Order>({ request: queryOrder, conditions })
    const [modalOptions, setModalOptions] = useState({ id: 0, open: false })
    const [contactOptions, setContactOptions] = useState<{ data: ContactInfo, open: boolean }>({ data: {}, open: false })
    const [statisticsInfo, setStatisticsInfo] = useState<Statistics>({ sellMoney: 0, buyMoney: 0, number: 0 })

    const queryStatistics = async (innerConditions?: any) => {
        const result = await statistics(innerConditions ?? conditions)
        setStatisticsInfo(result as Statistics)
    }

    const handleSearchForm = () => {
        searchForm()
        queryStatistics()
    }

    const handleOrderDelete = async (id = 0) => {
        await deleteOrder(id)
        message.success("删除成功")
        handleSearchForm()
    }

    const handleOrderStatusChange = async (id: number = 0, status: string) => {
        await changeOrderStatus(id, status)
        message.success("修改成功")
        searchForm()
    }

    const handleFormSearch = (values: any) => {
        const { createTime, ...restValues } = values
        let newConditions = restValues

        if (createTime) {
            newConditions = {
                ...restValues,
                startCreateDate: dayjs(createTime[0]).format("YYYY-MM-DD"),
                endCreateDate: dayjs(createTime[1]).format("YYYY-MM-DD")
            }
        }

        setConditions(newConditions);
        queryStatistics(newConditions)
    }

    const handleAfterCreate = () => {
        setModalOptions({ id: 0, open: false })
        handleSearchForm()
    }

    const handleEditClick = (id = 0) => {
        setModalOptions({ id, open: true });
    }

    const handleRevokeOutStock = async (order: Order) => {
        await revokeStockOrder(order.id ?? 0)
        handleSearchForm()
        message.success("撤销库存订单成功")
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
            title: '利润',
            dataIndex: 'number',
            render:(text:string,record:any)=>{
                return <>{parseFloat(`${record.sellPrice*record.number - record.buyPrice*record.number}`).toFixed(2)}</>
            }
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
                    <TextButton onClick={() => handleEditClick(record.id)}>编辑</TextButton>
                    {
                        record.status == "1" ?
                            <TextButton onClick={() => handleOrderStatusChange(record.id, "2")}>已完成</TextButton> :
                            <TextButton onClick={() => handleOrderStatusChange(record.id, "1")}>未完成</TextButton>
                    }
                    {
                        record.stockId ?
                            <TextButton onClick={() => handleRevokeOutStock(record)}>撤销出库</TextButton> :
                            <TextButton onClick={() => handleOrderDelete(record.id)}>删除</TextButton>
                    }

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
                    <DatePicker.RangePicker
                        presets={[
                            { label: "今天", value: [dayjs(), dayjs()] },
                            { label: "上周", value: [dayjs().add(-7, "day").day(1), dayjs().add(-7, "day").day(7)] },
                            { label: "本周", value: [dayjs().day(1), dayjs().day(7)] },
                            { label: "上月", value: [dayjs().add(-1, "month").startOf("month"), dayjs().add(-1, "month").endOf("month")] },
                            { label: "本月", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
                        ]} format={val => dayjs(val).format("YYYY-MM-DD")} allowClear placeholder={["起始日期", "结束日期"]} />
                </Form.Item>
                <Form.Item label="状态" name="status">
                    <Select allowClear options={STATUS} placeholder="请选择" />
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
        </SearchForm >
        <SearchForm>
            <div>汇总：
                <Space size="large">
                    <span>总成本：{statisticsInfo.buyMoney}</span>
                    <span>总售价：{statisticsInfo.sellMoney}</span>
                    <span>总利润：{parseFloat(`${statisticsInfo.sellMoney - statisticsInfo.buyMoney}`).toFixed(2)}</span>
                    <span>总数量：{statisticsInfo.number}</span>
                </Space>
            </div>
        </SearchForm>

        <div className={styles.tableWrapper}>
            <Table rowKey="id" loading={loading} dataSource={dataSource} columns={columns} />
        </div>

        <Modal destroyOnClose footer={null} title={modalOptions.id ? "编辑" : "新增"} open={modalOptions.open} onCancel={() => setModalOptions({ id: 0, open: false })} >
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

