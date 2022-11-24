import React, { useEffect, useState } from 'react'
import { Button, Form, Input, message } from "antd"
import { createStock, updateStock, queryStockById } from "@/services/stock"

type Props = {
    id?: string
    onSubmit?: () => void
}

export default (props: Props) => {
    const [oldData, setOldData] = useState<Partial<Product>>({})
    const [formRef] = Form.useForm()

    const handleFormSubmit = async (values: Stock) => {
        if (props.id) {
            await updateStock({ ...oldData, ...values })
        } else {
            await createStock(values)
        }
        message.success("保存成功")
        props?.onSubmit?.();
    }


    const loadData = async () => {
        if (props.id) {
            const data = await queryStockById(props.id)
            formRef.setFieldsValue(data)
            setOldData(data)
        }
    }

    useEffect(() => {
        loadData()
    }, [props.id])


    return <Form onFinish={handleFormSubmit} form={formRef}>
        <Form.Item label="品名" name="name">
            <Input />
        </Form.Item>
        <Form.Item label="进价" name="buyPrice">
            <Input />
        </Form.Item>
        <Form.Item label="售价" name="sellPrice">
            <Input />
        </Form.Item>
        <Form.Item label="数量" name="number">
            <Input />
        </Form.Item>
        <Form.Item >
            <Button htmlType='submit'>保存</Button>
        </Form.Item>
    </Form>
}