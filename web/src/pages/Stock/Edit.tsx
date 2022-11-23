import React, { useEffect } from 'react'
import { Button, Form, Input, message } from "antd"
import { createStock } from "@/services/stock"

type Props = {
    id?: string
    onSubmit?: () => void
}

export default (props: Props) => {

    const handleFormSubmit = async (values: Stock) => {
        await createStock(values)
        message.success("保存成功")
        props?.onSubmit?.();
    }

    useEffect(() => {
        console.log(props.id);
    }, [props.id])

    return <Form onFinish={handleFormSubmit}>
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