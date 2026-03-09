import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Spin, Divider } from 'antd';
import { ShopOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { session, user } = useAuth();

  // If already logged in and profile loaded, redirect based on role
  React.useEffect(() => {
    if (session && user) {
      if (user.role === 'PLATFORM_ADMIN') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    }
  }, [session, user, navigate]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      // The AuthContext will automatically detect the auth change, 
      // fetch the user profile, and the useEffect above will redirect them.
      message.success('Login successful!');
    } catch (error: any) {
      message.error(error.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        styles={{ body: { padding: '48px 40px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ShopOutlined style={{ fontSize: 28, color: 'white' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
            BQOM
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Boutique Order Management System
          </Text>
        </div>

        <Title level={4} style={{ marginBottom: 8, color: '#374151' }}>
          Sign In
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
          Enter your email and password to access your account.
        </Text>

        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                size="large"
                placeholder="admin@example.com"
                autoFocus
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                size="large"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ height: 48, fontSize: 16, fontWeight: 600 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <Divider style={{ margin: '24px 0 16px' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Platform Admin & Tenant Users login here.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
