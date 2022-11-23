import React, { useEffect } from 'react'
import { Button, Form, Input, message } from "antd"
import { createOrder } from "@/services/order"

type Props = {
    id?: string
    onSubmit?: () => void
}

export default (props: Props) => {

    const handleFormSubmit = async (values: Order) => {
        await createOrder(values)
        message.success("保存成功")
        props?.onSubmit?.();
    }

    useEffect(() => {
        console.log(props.id);
    }, [props.id])

    return <Form onFinish={handleFormSubmit}>
        <Form.Item label="产品名" name="name">
            <Input />
        </Form.Item>
        <Form.Item label="姓名" name="contact">
            <Input />
        </Form.Item>
        <Form.Item label="电话" name="phone">
            <Input />
        </Form.Item>
        <Form.Item label="地址" name="address">
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
        <Form.Item label="备注" name="remark">
            <Input />
        </Form.Item>
        <Form.Item >
            <Button htmlType='submit'>保存</Button>
        </Form.Item>
    </Form>
}