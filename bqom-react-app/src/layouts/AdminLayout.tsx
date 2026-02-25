import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, theme } from 'antd';
import { ArrowLeftOutlined, SettingOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header
        style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
          <div style={{ width: 1, height: 24, background: '#e8e8e8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ fontSize: 18, color: '#6366f1' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
              BQOM — Admin Panel
            </span>
          </div>
        </div>
        <span style={{ color: '#888', fontSize: 13 }}>Tenant Administration</span>
      </Header>
      <Content
        style={{
          margin: '24px',
          padding: 24,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
          minHeight: 'calc(100vh - 112px)',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AdminLayout;
