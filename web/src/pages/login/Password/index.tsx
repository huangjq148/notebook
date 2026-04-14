import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useState } from 'react';
import { login } from '@/services/auth';
import { setToken } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import styles from '../index.module.less';

const Password = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values);
      setToken(
        {
          access_token: result.access_token,
        },
        values.username,
      );
      message.success('登录成功');
      navigate('/overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="normal_login"
      className={styles.loginForm}
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="username"
        label="用户名"
        rules={[
          {
            required: true,
            message: '请输入用户名',
          },
        ]}
      >
        <Input
          size="large"
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder="请输入用户名"
          autoComplete="username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        label="密码"
        rules={[
          {
            required: true,
            message: '请输入密码',
          },
        ]}
      >
        <Input.Password
          size="large"
          prefix={<LockOutlined className="site-form-item-icon" />}
          placeholder="请输入密码"
          autoComplete="current-password"
        />
      </Form.Item>
      <Form.Item className={styles.formMetaRow}>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox className={styles.rememberCheckbox}>记住我</Checkbox>
        </Form.Item>

        {/* <a className="login-form-forgot" href="">
                    Forgot password
                </a> */}
      </Form.Item>

      <Form.Item>
        <Button type="primary" block htmlType="submit" size="large" loading={loading} className={styles.submitButton}>
          登录
        </Button>
        {/* Or <a href="">register now!</a> */}
      </Form.Item>
    </Form>
  );
};

export default Password;
