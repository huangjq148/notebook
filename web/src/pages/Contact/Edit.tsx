import React, { useEffect } from 'react'
import { Button, Form, Input, message } from "antd"
import { createContact } from "@/services/contact"

type Props = {
    id?: string
    onSubmit?: () => void
}

export default (props: Props) => {

    const handleFormSubmit = async (values: Contact) => {
        await createContact(values)
        message.success("保存成功")
        props?.onSubmit?.();
    }

    useEffect(() => {
        console.log(props.id);
    }, [props.id])

    return <Form onFinish={handleFormSubmit}>
        <Form.Item label="姓名" name="name">
            <Input />
        </Form.Item>
        <Form.Item label="电话" name="phone">
            <Input />
        </Form.Item>
        <Form.Item label="地址" name="address">
            <Input />
        </Form.Item>
        <Form.Item >
            <Button htmlType='submit'>保存</Button>
        </Form.Item>
    </Form>
}