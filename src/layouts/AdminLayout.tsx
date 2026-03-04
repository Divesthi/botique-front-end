import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, theme, Space } from 'antd';
import { ArrowLeftOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary, colorTextSecondary },
  } = theme.useToken();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isTenantsActive = location.pathname.includes('/admin/tenants');
  const isUsersActive = location.pathname.includes('/admin/users');

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
            onClick={handleLogout}
            style={{ color: '#ef4444' }}
          >
            Logout
          </Button>
          <div style={{ width: 1, height: 24, background: '#e8e8e8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ fontSize: 18, color: '#6366f1' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginRight: 24 }}>
              BQOM — Admin Panel
            </span>
            <Space size="large">
              <Button
                type="text"
                onClick={() => navigate('/admin/tenants')}
                style={{
                  fontWeight: 500,
                  color: isTenantsActive ? colorPrimary : colorTextSecondary,
                  background: isTenantsActive ? '#eef2ff' : 'transparent',
                }}
              >
                Tenants
              </Button>
              <Button
                type="text"
                onClick={() => navigate('/admin/users')}
                style={{
                  fontWeight: 500,
                  color: isUsersActive ? colorPrimary : colorTextSecondary,
                  background: isUsersActive ? '#eef2ff' : 'transparent',
                }}
              >
                Users
              </Button>
            </Space>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 13 }}>
          <UserOutlined />
          <span>{user?.displayName || user?.email} ({user?.role})</span>
        </div>
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
