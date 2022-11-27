import React, { useEffect, useState } from 'react'
import { Button, Form, Input, message, Modal } from "antd"
import { createOrder, updateOrder, queryOrderById } from "@/services/order"
import { queryContactByName } from "@/services/contact"
import CreateContact from "@/pages/Contact/Edit"

type Props = {
    id?: string
    onSubmit?: () => void
}
interface UserValue {
    label: string;
    value: string;
}

export default (props: Props) => {
    const [oldData, setOldData] = useState<Partial<Order>>({})
    const [formRef] = Form.useForm()
    const [contactOpen, setContactOpen] = useState<boolean>(false)

    const handleFormSubmit = async (values: Order) => {
        if (props.id) {
            await updateOrder({ ...oldData, ...values })
        } else {
            await createOrder({ ...values, status: '1' })
        }
        message.success("保存成功")
        props?.onSubmit?.();
    }

    const loadData = async () => {
        if (props.id) {
            const data = await queryOrderById(props.id)
            formRef.setFieldsValue(data)
            setOldData(data)
        }
    }

    const handleSelcetItemClick = ({ name, phone, address }: { name: string, phone: string, address: string }) => {
        formRef.setFieldsValue({
            contact: name,
            phone,
            address
        })

    }

    const fetchContact = async (search: string) => {
        if (!search) {
            return []
        }

        const result = await queryContactByName(search)
        return result.map(item => ({
            value: item.id as string,
            showLabel: item.name,
            label: <div onClick={() => handleSelcetItemClick(item)} style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
                <span>{item.name}</span>
                <span>{item.address}</span>
            </div>,
        }))
    }

    const handleAfterCreateContact = () => {
        setContactOpen(false)
    }

    useEffect(() => {
        loadData()
    }, [props.id])

    return <>
        <Form onFinish={handleFormSubmit} form={formRef}>
            <Form.Item label="产品名" name="name">
                <Input />
            </Form.Item>
            <Form.Item label="姓名" name="contact" >
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
                <Button htmlType='submit' type="primary">保存</Button>
            </Form.Item>
        </Form>
        <Modal title="新增联系人" footer={null} open={contactOpen} destroyOnClose onCancel={() => setContactOpen(false)}>
            <CreateContact onSubmit={handleAfterCreateContact} />
        </Modal>
    </>
}