import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Tag, Statistic, Empty, Spin, Button } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { Order, Bill } from '../../types';
import { orderService } from '../../services/orderService';
import { billService } from '../../services/billService';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
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
      const [ordersData, billsData] = await Promise.all([
        orderService.getAllOrders(),
        billService.getAllBills(),
      ]);
      setOrders(ordersData);
      setBills(billsData);
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
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
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

  const completedToday = orders.filter(
    (o) =>
      (o.status === 'completed' || o.status === 'delivered') &&
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
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Advance',
      dataIndex: 'advance',
      key: 'advance',
      width: 120,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#888', fontSize: '14px' }}>
            Last updated: {dayjs(lastUpdated).format('HH:mm:ss')}
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
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Orders"
              value={activeOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Yet to be Delivered"
              value={ordersYetToBeDelivered}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Orders" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          <Empty description="No orders found" />
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
