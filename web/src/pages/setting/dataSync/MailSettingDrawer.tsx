import { fetchDataSyncMailConfig, saveDataSyncMailConfig, type DataSyncMailConfig } from '@/services/system';
import { Button, Drawer, Form, Input, Select, Space, Switch, message } from 'antd';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormValues = {
  isEnable: boolean;
  sendHour: number;
  mailUsername: string;
  mailAuthCode?: string;
  mailFrom?: string;
  mailTo: string;
  mailHost: string;
  mailPort: string;
};

const hourOptions = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: `${String(hour).padStart(2, '0')}:00`,
}));

const MailSettingDrawer = ({ open, onClose }: Props) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasAuthCode, setHasAuthCode] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config: DataSyncMailConfig = await fetchDataSyncMailConfig();
      setHasAuthCode(!!config.hasAuthCode);
      form.setFieldsValue({
        isEnable: config.isEnable === '1',
        sendHour: config.sendHour ?? 12,
        mailUsername: config.mailUsername,
        mailAuthCode: '',
        mailFrom: config.mailFrom,
        mailTo: config.mailTo,
        mailHost: config.mailHost || 'smtp.qq.com',
        mailPort: config.mailPort || '587',
      });
    } catch (error: any) {
      message.error(error?.message || '读取配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const handleSave = async () => {
    const values = await form.validateFields();

    if (values.isEnable && !values.mailAuthCode && !hasAuthCode) {
      message.error('开启定时备份前，请先填写 SMTP 授权码');
      return;
    }

    setSaving(true);
    try {
      await saveDataSyncMailConfig({
        isEnable: values.isEnable ? '1' : '0',
        sendHour: values.sendHour,
        mailUsername: values.mailUsername,
        mailAuthCode: values.mailAuthCode || '',
        mailFrom: values.mailFrom || '',
        mailTo: values.mailTo,
        mailHost: values.mailHost,
        mailPort: values.mailPort,
      });
      message.success('保存成功');
      onClose();
    } catch (error: any) {
      message.error(error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="邮箱备份设置"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
      loading={loading}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isEnable: false,
          sendHour: 12,
          mailHost: 'smtp.qq.com',
          mailPort: '587',
        }}
      >
        <Form.Item label="开启每日定时备份" name="isEnable" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="发送时间" name="sendHour" rules={[{ required: true, message: '请选择发送时间' }]}>
          <Select options={hourOptions} placeholder="每天发送时间" />
        </Form.Item>

        <Form.Item
          label="发件邮箱"
          name="mailUsername"
          rules={[
            { required: true, message: '请输入发件邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input placeholder="例如 xxx@qq.com" />
        </Form.Item>

        <Form.Item
          label="SMTP 授权码"
          name="mailAuthCode"
          extra={
            hasAuthCode
              ? '已设置授权码，留空则不修改。授权码在 QQ 邮箱设置-账户中开启 POP3/SMTP 服务后获取'
              : '在 QQ 邮箱设置-账户中开启 POP3/SMTP 服务后获取，不是登录密码'
          }
        >
          <Input.Password placeholder={hasAuthCode ? '已设置，留空则不修改' : '请输入授权码'} />
        </Form.Item>

        <Form.Item
          label="收件邮箱"
          name="mailTo"
          rules={[
            { required: true, message: '请输入收件邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input placeholder="接收备份的邮箱，例如 xxx@qq.com" />
        </Form.Item>

        <Form.Item label="发件人（可选）" name="mailFrom" extra="默认与发件邮箱相同">
          <Input placeholder="默认同发件邮箱" />
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item
            label="SMTP 服务器"
            name="mailHost"
            rules={[{ required: true, message: '请输入 SMTP 服务器' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="smtp.qq.com" />
          </Form.Item>
          <Form.Item
            label="端口"
            name="mailPort"
            rules={[{ required: true, message: '请输入端口' }]}
            style={{ width: 120 }}
          >
            <Input placeholder="587" />
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
};

export default MailSettingDrawer;
