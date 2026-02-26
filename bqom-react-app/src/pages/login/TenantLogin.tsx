import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Spin, Divider } from 'antd';
import { ShopOutlined, SettingOutlined } from '@ant-design/icons';
import { useTenant } from '../../context/TenantContext';
import { tenantService } from '../../services/tenantService';

const { Title, Text } = Typography;

const TenantLogin: React.FC = () => {
  const { setTenant } = useTenant();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { tenantCode: string }) => {
    const code = values.tenantCode.trim();
    try {
      setLoading(true);
      const tenant = await tenantService.getTenantByCode(code);
      if (!tenant || !tenant.active) {
        message.error(tenant ? 'This tenant account is inactive.' : 'Tenant code not found.');
        return;
      }
      setTenant(code, tenant.name);
      message.success(`Welcome, ${tenant.name}!`);
      navigate('/');
    } catch {
      message.error('Invalid tenant code. Please check and try again.');
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
          Enter Tenant Code
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
          Enter your organisation's unique tenant code to continue.
        </Text>

        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="tenantCode"
              label="Tenant Code"
              rules={[
                { required: true, message: 'Please enter your tenant code' },
                { min: 2, message: 'Tenant code must be at least 2 characters' },
              ]}
            >
              <Input
                size="large"
                placeholder="e.g. BOUTIQUE01"
                autoFocus
                autoComplete="off"
                style={{ letterSpacing: 1 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ height: 48, fontSize: 16, fontWeight: 600 }}
              >
                Continue
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <Divider style={{ margin: '24px 0 16px' }} />

        <div style={{ textAlign: 'center' }}>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => navigate('/admin/tenants')}
            style={{ color: '#6b7280', fontSize: 13 }}
          >
            Admin — Manage Tenants
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TenantLogin;
