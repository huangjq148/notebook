import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { login } from '@/services/auth';
import { setToken } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';

const Password = () => {
  const navigate = useNavigate();
  const onFinish = async (values: { username: string; password: string }) => {
    const result = await login(values);
    setToken(
      {
        access_token: result.access_token,
      },
      values.username,
    );
    message.success('登陆成功');
    navigate('/overview');
  };

  return (
    <Form
      name="normal_login"
      className="login-form"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="username"
        rules={[
          {
            required: true,
            message: '请输入用户名!',
          },
        ]}
      >
        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="用户名" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: '请输入密码!',
          },
        ]}
      >
        <Input prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>记住我</Checkbox>
        </Form.Item>

        {/* <a className="login-form-forgot" href="">
                    Forgot password
                </a> */}
      </Form.Item>

      <Form.Item>
        <Button type="primary" block htmlType="submit" className="login-form-button">
          登陆
        </Button>
        {/* Or <a href="">register now!</a> */}
      </Form.Item>
    </Form>
  );
};

export default Password;
