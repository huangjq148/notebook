import React, { useEffect, useState } from 'react'
import { Button, Form, Input, message, Modal } from "antd"
import { createOrder, updateOrder, queryOrderById } from "@/services/order"
import CreateContact from "@/pages/Contact/Edit"
import ContactList from "./ContactList"
import ProductList from "./ProductList"

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
    const [productModal, setProductModal] = useState({ open: false })
    const [contactModal, setContactModal] = useState({ open: false })

    const handleContactSelect = (val: Contact) => {
        formRef.setFieldsValue({
            contact: val.name,
            phone: val.phone,
            address: val.address
        })

        setContactModal({ open: false })
    }

    const handleProductSelect = (val: Product) => {
        formRef.setFieldsValue({
            name: val.name,
            sellPrice: val.sellPrice,
            buyPrice: val.buyPrice
        })

        setProductModal({ open: false })
    }

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

    const handleAfterCreateContact = () => {
        setContactOpen(false)
    }

    useEffect(() => {
        loadData()
    }, [props.id])

    return <>
        <Form onFinish={handleFormSubmit} form={formRef}>
            <div style={{ display: "flex", width: "100%" }}>
                <Form.Item label="产品名" name="name" style={{ width: "100%", marginRight: "10px" }} rules={[{ required: true, message: '请输入产品名' }]}>
                    <Input />
                </Form.Item>
                <Button type="primary" onClick={() => setProductModal({ open: true })}>选择</Button>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <Form.Item label="姓名" name="contact" style={{ width: "100%", marginRight: "10px" }} rules={[{ required: true, message: '请输入姓名' }]}>
                    <Input />
                </Form.Item>
                <Button type="primary" onClick={() => setContactModal({ open: true })}>选择</Button>
            </div>
            <Form.Item label="电话" name="phone">
                <Input />
            </Form.Item>
            <Form.Item label="地址" name="address">
                <Input />
            </Form.Item>
            <Form.Item label="进价" name="buyPrice" rules={[{ required: true, message: '请输入进价' }]}>
                <Input />
            </Form.Item>
            <Form.Item label="售价" name="sellPrice" rules={[{ required: true, message: '请输入售价' }]}>
                <Input />
            </Form.Item>
            <Form.Item label="数量" name="number" rules={[{ required: true, message: '请输入数量' }]}>
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

        <Modal footer={null} width={1000} open={contactModal.open} onCancel={() => setContactModal({ open: false })}>
            <ContactList onRowSelect={handleContactSelect} />
        </Modal>

        <Modal footer={null} width={1000} open={productModal.open} onCancel={() => setProductModal({ open: false })}>
            <ProductList onRowSelect={handleProductSelect} />
        </Modal>
    </>
}