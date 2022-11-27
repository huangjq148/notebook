import React, { useEffect, useState } from 'react'
import { Button, Form, Input, message } from "antd"
import { createProduct, updateProduct, queryProductById } from "@/services/product"

type Props = {
    id?: number
    onSubmit?: () => void
}

export default (props: Props) => {
    const [oldData, setOldData] = useState<Partial<Product>>({})
    const [formRef] = Form.useForm()

    const handleFormSubmit = async (values: Product) => {
        if (props.id) {
            await updateProduct({ ...oldData, ...values })
        } else {
            await createProduct(values)
        }
        message.success("保存成功")
        props?.onSubmit?.();
    }

    const loadData = async () => {
        if (props.id) {
            const data = await queryProductById(props.id)
            formRef.setFieldsValue(data)
            setOldData(data)
        }
    }

    useEffect(() => {
        loadData()
    }, [props.id])

    return <Form onFinish={handleFormSubmit} form={formRef}>
        <Form.Item label="商品" name="name">
            <Input />
        </Form.Item>
        <Form.Item label="进价" name="buyPrice">
            <Input />
        </Form.Item>
        <Form.Item label="售价" name="sellPrice">
            <Input />
        </Form.Item>
        <Form.Item >
            <Button htmlType='submit'>保存</Button>
        </Form.Item>
    </Form>
}