import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { TenantProvider, useTenant } from './context/TenantContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import TenantLogin from './pages/login/TenantLogin';
import TenantsAdmin from './pages/admin/TenantsAdmin';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import CustomerView from './pages/customers/CustomerView';
import Measurements from './pages/measurements/Measurements';
import MeasurementView from './pages/measurements/MeasurementView';
import Orders from './pages/orders/Orders';
import OrderView from './pages/orders/OrderView';
import Bills from './pages/bills/Bills';
import BillView from './pages/bills/BillView';
import TenantSettings from './pages/admin/TenantSettings';

// Guard: redirect to /login if no tenant code is set
const RequireTenant: React.FC = () => {
  const { tenantCode } = useTenant();
  return tenantCode ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
        },
      }}
    >
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            {/* Public: tenant code entry screen */}
            <Route path="/login" element={<TenantLogin />} />

            {/* Public: admin panel — no tenant code needed */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/tenants" replace />} />
              <Route path="tenants" element={<TenantsAdmin />} />
              <Route path="tenants/:code/settings" element={<TenantSettings />} />
            </Route>

            {/* Protected: require tenant code */}
            <Route element={<RequireTenant />}>
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
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </ConfigProvider>
  );
}

export default App;
