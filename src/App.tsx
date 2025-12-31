import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import CustomerView from './pages/customers/CustomerView';
import Measurements from './pages/measurements/Measurements';
import MeasurementView from './pages/measurements/MeasurementView';
import Orders from './pages/orders/Orders';
import OrderView from './pages/orders/OrderView';
import Bills from './pages/bills/Bills';
import BillView from './pages/bills/BillView';

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
      <BrowserRouter>
        <Routes>
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
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
