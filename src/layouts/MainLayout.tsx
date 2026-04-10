import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Tooltip, Avatar, Drawer, Grid } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  PoweroffOutlined,
  DollarOutlined,
  ColumnWidthOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

/* ── Small needle SVG for the logo ───────────────────────── */
const NeedleLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 24 L22 6" stroke="#E8D4A8" strokeWidth="2.8" strokeLinecap="round" />
    <ellipse
      cx="21.5"
      cy="6.5"
      rx="3"
      ry="1.8"
      transform="rotate(-45 21.5 6.5)"
      fill="#2D1B25"
      stroke="#C9A96E"
      strokeWidth="1.6"
    />
    <path
      d="M21 8 Q16 13 13 17 Q10 20 5 25"
      stroke="#C9A96E"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeDasharray="2.5 2"
      fill="none"
      opacity="0.85"
    />
  </svg>
);

/* ── Role display helper ──────────────────────────────────── */
const roleLabel = (role: string) =>
  role.replace('TENANT_', '').replace('PLATFORM_', '');

const MainLayout: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
    { key: '/measurements', icon: <ColumnWidthOutlined />, label: 'Measurements' },
    { key: '/orders', icon: <ShoppingOutlined />, label: 'Orders' },
    { key: '/bills', icon: <FileTextOutlined />, label: 'Bills' },
    ...((user?.role === 'TENANT_ADMIN' || user?.role === 'PLATFORM_ADMIN')
      ? [{ key: '/revenue', icon: <DollarOutlined />, label: 'Revenue' }]
      : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) setDrawerOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  /* ── Shared sidebar content ─────────────────────────────── */
  const logoArea = (showText: boolean) => (
    <div
      style={{
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: showText ? 'flex-start' : 'center',
        padding: showText ? '0 20px' : '0',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
        gap: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onClick={() => { navigate('/'); if (isMobile) setDrawerOpen(false); }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #8B3A5A 0%, #5C2238 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(139,58,90,0.4)',
        }}
      >
        <NeedleLogo size={22} />
      </div>
      {showText && (
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#E8D4A8',
              letterSpacing: 3,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            BQOM
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(201,169,110,0.65)',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Boutique Orders
          </div>
        </div>
      )}
    </div>
  );

  const menuComponent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ marginTop: 8, border: 'none' }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={240}
          title={
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#E8D4A8',
                letterSpacing: 3,
                lineHeight: 1.1,
              }}
            >
              BQOM
              <div style={{ fontSize: 9, color: 'rgba(201,169,110,0.65)', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 400, marginTop: 2 }}>
                Boutique Orders
              </div>
            </div>
          }
          closeIcon={<span style={{ color: 'rgba(201,169,110,0.7)', fontSize: 16, lineHeight: 1 }}>✕</span>}
          styles={{
            body: { padding: 0, background: '#2D1B25' },
            header: { background: '#2D1B25', borderBottom: '1px solid rgba(201,169,110,0.15)' },
          }}
        >
          {menuComponent}
        </Drawer>
      )}

      {/* ── Desktop / Tablet Sider ───────────────────────────── */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          style={{ position: 'relative' }}
        >
          {logoArea(!collapsed)}
          {menuComponent}
          {!collapsed && (
            <div
              style={{
                position: 'absolute',
                bottom: 48,
                left: 20,
                right: 20,
                height: 1,
                background:
                  'repeating-linear-gradient(90deg, rgba(201,169,110,0.3) 0px, rgba(201,169,110,0.3) 6px, transparent 6px, transparent 12px)',
              }}
            />
          )}
        </Sider>
      )}

      <Layout>
        {/* ── Header ──────────────────────────────────────────── */}
        <Header
          style={{
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: toggle + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <Button
              type="text"
              icon={
                isMobile
                  ? <MenuOutlined />
                  : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              }
              onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
              style={{
                fontSize: 16,
                color: '#7A6068',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            {!isMobile && (
              <>
                <div style={{ width: 1, height: 22, background: '#E8DDD8' }} />
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 17,
                    fontWeight: 600,
                    color: '#2D1B25',
                    letterSpacing: 0.3,
                  }}
                >
                  Boutique Order Management
                </span>
              </>
            )}
          </div>

          {/* Right: user info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            <Avatar
              size={32}
              style={{
                background: 'linear-gradient(135deg, #8B3A5A, #5C2238)',
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Avatar>

            {!isMobile && (
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2D1B25' }}>
                  {user?.tenantName || user?.tenantCode || '—'}
                </div>
                <div style={{ fontSize: 11, color: '#7A6068' }}>
                  {user?.role ? roleLabel(user.role) : ''}
                </div>
              </div>
            )}

            <div style={{ width: 1, height: 22, background: '#E8DDD8' }} />

            <Tooltip title="Sign out">
              <Button
                type="text"
                icon={<PoweroffOutlined />}
                onClick={handleLogout}
                style={{
                  color: '#8B3A5A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                {!isMobile && 'Logout'}
              </Button>
            </Tooltip>
          </div>
        </Header>

        {/* ── Content ─────────────────────────────────────────── */}
        <Content
          style={{
            margin: isMobile ? '12px' : '20px 20px',
            padding: isMobile ? '16px' : '24px 28px',
            minHeight: 'calc(100vh - 108px)',
            background: '#ffffff',
            borderRadius: isMobile ? 12 : 16,
            border: '1px solid #F0E8E2',
            boxShadow: '0 2px 10px rgba(139,58,90,0.05)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
