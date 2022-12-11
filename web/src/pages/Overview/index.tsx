import React, { useEffect, useState } from 'react'
import { Table, Form, Input, Button, Space, List, Typography, DatePicker } from 'antd'
import { SearchForm } from "@/components"
import { useTable } from '@/hooks'
import styles from "./index.module.less"
import { getTop5Data } from '@/services/overview'
import dayjs from 'dayjs'

type TopData = {
    name: string;
    money: string;
}

export default () => {
    const [conditions, setConditions] = useState({})
    const [topData, setTopData] = useState<any>({})


    const loadTopData = async (conditions?: Record<string, any>) => {
        const result = await getTop5Data(conditions) as any
        setTopData(result)
    }

    useEffect(() => { loadTopData() }, [])

    const handleFormSearch = (values: any) => {
        let conditions = {}

        if (values.orderTime?.length) {
            conditions = {
                startOrderTime: dayjs(values.orderTime[0]).format("YYYY-MM-DD"),
                endOrderTime: dayjs(values.orderTime[1]).format("YYYY-MM-DD")
            }
        }

        loadTopData(conditions)
    }

    return <div>
        <SearchForm>
            <Form onFinish={handleFormSearch} layout="inline">
                <Form.Item label="日期" name="orderTime">
                    <DatePicker.RangePicker
                        presets={[
                            { label: "今天", value: [dayjs(), dayjs()] },
                            { label: "上周", value: [dayjs().add(-7, "day").day(1), dayjs().add(-7, "day").day(7)] },
                            { label: "本周", value: [dayjs().day(1), dayjs().day(7)] },
                            { label: "上月", value: [dayjs().add(-1, "month").startOf("month"), dayjs().add(-1, "month").endOf("month")] },
                            { label: "本月", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
                        ]} format={val => dayjs(val).format("YYYY-MM-DD")} allowClear placeholder={["起始日期", "结束日期"]} />
                </Form.Item>

                <Form.Item>
                    <Button htmlType='submit' type="primary">查询</Button>
                </Form.Item>
            </Form>
        </SearchForm>
        <div className={styles.topListWrapper}>
            <List
                header={<div>购买最多的产品</div>}
                bordered
                dataSource={topData.top5BuyGoods ?? []}
                renderItem={(item: TopData) => (
                    <List.Item>
                        <><span>{item.name}</span> {item.money}</>
                    </List.Item>
                )}
            />
            <List
                header={<div>卖的最多的产品</div>}
                bordered
                dataSource={topData.top5SellGoods ?? []}
                renderItem={(item: TopData) => (
                    <List.Item>
                        <><span>{item.name}</span> {item.money}</>
                    </List.Item>
                )}
            />
            <List
                header={<div>利润最高的产品</div>}
                bordered
                dataSource={topData.top5ProfitGoods ?? []}
                renderItem={(item: TopData) => (
                    <List.Item>
                        <><span>{item.name}</span> {item.money}</>
                    </List.Item>
                )}
            />
            <List
                header={<div>利润最多的客户</div>}
                bordered
                dataSource={topData.top5BuyCustomer ?? []}
                renderItem={(item: TopData) => (
                    <List.Item>
                        <><span>{item.name}</span> {item.money}</>
                    </List.Item>
                )}
            />
        </div>
    </div>
}