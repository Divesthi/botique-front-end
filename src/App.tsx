import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/login/TenantLogin';
import TenantsAdmin from './pages/admin/TenantsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import CustomerView from './pages/customers/CustomerView';
import Measurements from './pages/measurements/Measurements';
import MeasurementView from './pages/measurements/MeasurementView';
import Orders from './pages/orders/Orders';
import OrderView from './pages/orders/OrderView';
import Bills from './pages/bills/Bills';
import BillView from './pages/bills/BillView';
import Revenue from './pages/revenue/Revenue';
import TenantSettings from './pages/admin/TenantSettings';

// Guard: redirect to /login if no valid session/profile
const RequireAuth: React.FC = () => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#FAF7F4' }}>
        <Spin size="large" />
      </div>
    );
  }

  return session && user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Guard: redirect if user is not a PLATFORM_ADMIN
const RequirePlatformAdmin: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user?.role === 'PLATFORM_ADMIN' ? <Outlet /> : <Navigate to="/" replace />;
};

// Guard: redirect if user is not a TENANT_ADMIN or PLATFORM_ADMIN
const RequireTenantAdmin: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (user?.role === 'TENANT_ADMIN' || user?.role === 'PLATFORM_ADMIN') ? <Outlet /> : <Navigate to="/" replace />;
};

// Guard: redirect if user is PLATFORM_ADMIN trying to access tenant routes directly without tenant context
const RequireTenantScope: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Platform admins should use the admin dashboard, not the tenant dashboard
  return user?.role === 'PLATFORM_ADMIN' ? <Navigate to="/admin/users" replace /> : <Outlet />;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#8B3A5A',
          colorLink: '#8B3A5A',
          colorLinkHover: '#5C2238',
          borderRadius: 10,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          colorBgContainer: '#ffffff',
          colorBgLayout: '#FAF7F4',
          colorBorder: '#E8DDD8',
          colorTextSecondary: '#7A6068',
        },
        components: {
          Layout: {
            siderBg: '#2D1B25',
            triggerBg: '#3D2030',
            headerBg: '#ffffff',
            bodyBg: '#FAF7F4',
          },
          Menu: {
            darkItemBg: '#2D1B25',
            darkItemSelectedBg: '#8B3A5A',
            darkItemHoverBg: '#3D2030',
            darkSubMenuItemBg: '#231520',
            darkItemSelectedColor: '#E8D4A8',
            darkItemColor: 'rgba(232, 212, 168, 0.75)',
          },
          Button: {
            primaryColor: '#ffffff',
          },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public: login screen */}
            <Route path="/login" element={<Login />} />

            {/* Protected: All routes require authentication */}
            <Route element={<RequireAuth />}>

              {/* Admin Panel: Only for PLATFORM_ADMIN */}
              <Route element={<RequirePlatformAdmin />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/users" replace />} />
                  <Route path="tenants" element={<TenantsAdmin />} />
                  <Route path="tenants/:code/settings" element={<TenantSettings />} />
                  <Route path="users" element={<UsersAdmin />} />
                </Route>
              </Route>

              {/* Tenant Panel: For TENANT_ADMIN and TENANT_USER */}
              <Route element={<RequireTenantScope />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:mobileNo" element={<CustomerView />} />
                  <Route path="measurements" element={<Measurements />} />
                  <Route path="measurements/:id" element={<MeasurementView />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderView />} />
                  <Route path="bills" element={<Bills />} />
                  <Route path="bills/:id" element={<BillView />} />

                  {/* Tenant Admin Only: Revenue */}
                  <Route element={<RequireTenantAdmin />}>
                    <Route path="revenue" element={<Revenue />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
