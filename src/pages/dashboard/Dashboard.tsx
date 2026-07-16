import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Tag, Statistic, Empty, Spin, Button } from 'antd';
import {
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  CarOutlined,
} from '@ant-design/icons';
import type { Order } from '../../types';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
import { formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();

    // Auto-refresh dashboard every 10 seconds for faster updates
    const interval = setInterval(() => {
      loadData(false, false); // Don't show loading spinner on auto-refresh
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const loadData = async (showLoading = true, showRefreshing = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      if (showRefreshing && !showLoading) {
        setRefreshing(true);
      }
      const ordersData = await orderService.getAllOrders(tenantCode);
      setOrders(ordersData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  };

  const handleManualRefresh = () => {
    loadData(false, true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      fresh: 'blue',
      in_progress: 'orange',
      completed: 'green',
      delivered: 'purple',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      fresh: 'Fresh',
      in_progress: 'In Progress',
      completed: 'Completed',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  // Calculate statistics
  const activeOrders = orders.filter((o) => o.status === 'in_progress').length;

  // Pending orders: orders with status 'fresh' or 'in_progress' that have passed the delivery date
  const pendingOrders = orders.filter((o) =>
    (o.status === 'fresh' || o.status === 'in_progress') &&
    o.deliveryDate &&
    dayjs(o.deliveryDate).isBefore(dayjs(), 'day')
  ).length;

  // Orders yet to be delivered: orders whose status is not 'delivered' and have passed the delivery date
  const ordersYetToBeDelivered = orders.filter((o) =>
    o.status !== 'delivered' &&
    o.deliveryDate &&
    dayjs(o.deliveryDate).isBefore(dayjs(), 'day')
  ).length;

  // Orders delivered today: orders with status 'delivered' and deliveredDate is today
  const deliveredToday = orders.filter(
    (o) =>
      o.status === 'delivered' &&
      o.deliveredDate &&
      dayjs(o.deliveredDate).isSame(dayjs(), 'day')
  ).length;

  // Pending for delivery today: orders scheduled for today that are not yet delivered
  const pendingForDeliveryToday = orders.filter(
    (o) =>
      (o.status === 'fresh' || o.status === 'in_progress' || o.status === 'completed') &&
      o.deliveryDate &&
      dayjs(o.deliveryDate).isSame(dayjs(), 'day')
  ).length;

  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: (a, b) => a.id! - b.id!,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobileNo',
      key: 'mobileNo',
      width: 150,
    },
    {
      title: 'Total Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      width: 120,
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      width: 150,
      sorter: (a, b) => {
        if (!a.receivedDate) return 1;
        if (!b.receivedDate) return -1;
        return dayjs(a.receivedDate).valueOf() - dayjs(b.receivedDate).valueOf();
      },
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 150,
      sorter: (a, b) => {
        if (!a.deliveryDate) return 1;
        if (!b.deliveryDate) return -1;
        return dayjs(a.deliveryDate).valueOf() - dayjs(b.deliveryDate).valueOf();
      },
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Advance',
      dataIndex: 'advance',
      key: 'advance',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header-bar">
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: '#888', fontSize: '14px' }}>
            Updated: {dayjs(lastUpdated).format('HH:mm:ss')}
          </span>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleManualRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate('/orders?filter=active')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Active Orders"
              value={activeOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate('/orders?filter=pending')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Pending Orders"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate('/orders?filter=yet_to_deliver')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Yet to be Delivered"
              value={ordersYetToBeDelivered}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/orders?filter=delivered_today')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Delivered Today"
              value={deliveredToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/orders?filter=pending_delivery_today')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Pending Delivery Today"
              value={pendingForDeliveryToday}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Orders (Last 5)" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          <Empty description="No orders found" />
        ) : (
          <Table
            columns={columns}
            dataSource={[...orders].sort((a, b) => b.id! - a.id!).slice(0, 5)}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
