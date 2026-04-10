import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Space, Avatar, Tooltip, Drawer, Grid } from 'antd';
import {
  PoweroffOutlined,
  TeamOutlined,
  AppstoreOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isTenantsActive = location.pathname.includes('/admin/tenants');
  const isUsersActive = location.pathname.includes('/admin/users');

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    fontWeight: 500,
    fontSize: 13,
    height: 34,
    borderRadius: 8,
    color: active ? '#8B3A5A' : '#7A6068',
    background: active ? 'rgba(139,58,90,0.08)' : 'transparent',
    border: active ? '1px solid rgba(139,58,90,0.2)' : '1px solid transparent',
    transition: 'all 0.2s',
  });

  const navItems = (
    <Space size={8} direction={isMobile ? 'vertical' : 'horizontal'} style={isMobile ? { padding: '8px 0', width: '100%' } : {}}>
      <Button
        type="text"
        icon={<AppstoreOutlined />}
        onClick={() => { navigate('/admin/tenants'); if (isMobile) setDrawerOpen(false); }}
        style={navBtnStyle(isTenantsActive)}
      >
        Tenants
      </Button>
      <Button
        type="text"
        icon={<TeamOutlined />}
        onClick={() => { navigate('/admin/users'); if (isMobile) setDrawerOpen(false); }}
        style={navBtnStyle(isUsersActive)}
      >
        Users
      </Button>
    </Space>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#FAF7F4' }}>
      {/* ── Mobile Nav Drawer ─────────────────────────── */}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={220}
          title={
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: '#2D1B25', letterSpacing: 2 }}>
              BQOM Admin
            </span>
          }
          styles={{ header: { borderBottom: '1px solid #F0E8E2' } }}
        >
          {navItems}
        </Drawer>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <Header
        style={{
          padding: isMobile ? '0 12px' : '0 28px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F0E8E2',
          boxShadow: '0 1px 8px rgba(45,27,37,0.07)',
        }}
      >
        {/* Left: brand + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 20 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ color: '#7A6068', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          )}

          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #8B3A5A 0%, #5C2238 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(139,58,90,0.3)', flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 16 L14 4" stroke="#E8D4A8" strokeWidth="2.2" strokeLinecap="round" />
                <ellipse cx="13.5" cy="4.5" rx="2" ry="1.2" transform="rotate(-45 13.5 4.5)" fill="#2D1B25" stroke="#C9A96E" strokeWidth="1.2" />
              </svg>
            </div>
            <span
              className="admin-nav-text"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: '#2D1B25', letterSpacing: 2 }}
            >
              BQOM
            </span>
            <span
              className="admin-nav-text"
              style={{ fontSize: 11, color: '#7A6068', background: '#F0E8E2', border: '1px solid #E8DDD8', borderRadius: 6, padding: '2px 8px', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}
            >
              Admin
            </span>
          </div>

          {!isMobile && (
            <>
              <div style={{ width: 1, height: 22, background: '#E8DDD8' }} />
              {navItems}
            </>
          )}
        </div>

        {/* Right: user info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          <Avatar
            size={30}
            style={{ background: 'linear-gradient(135deg, #8B3A5A, #5C2238)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
          >
            {(user?.displayName || user?.email || 'A')[0].toUpperCase()}
          </Avatar>
          {!isMobile && (
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2D1B25' }}>
                {user?.displayName || user?.email}
              </div>
              <div style={{ fontSize: 10, color: '#7A6068' }}>Platform Admin</div>
            </div>
          )}

          <div style={{ width: 1, height: 20, background: '#E8DDD8' }} />

          <Tooltip title="Sign out">
            <Button
              type="text"
              icon={<PoweroffOutlined />}
              onClick={handleLogout}
              style={{ color: '#8B3A5A', fontSize: 13, fontWeight: 500 }}
            >
              {!isMobile && 'Logout'}
            </Button>
          </Tooltip>
        </div>
      </Header>

      {/* ── Content ───────────────────────────────────────── */}
      <Content
        style={{
          margin: isMobile ? '12px' : '24px',
          padding: isMobile ? '16px' : '28px',
          background: '#ffffff',
          borderRadius: isMobile ? 12 : 16,
          border: '1px solid #F0E8E2',
          boxShadow: '0 2px 10px rgba(139,58,90,0.05)',
          minHeight: 'calc(100vh - 112px)',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AdminLayout;
