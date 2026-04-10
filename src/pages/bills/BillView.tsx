import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, message, Table, Tag } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import type { Bill, Customer, Order } from '../../types';
import { billService } from '../../services/billService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const BillView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [bill, setBill] = useState<Bill | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillData();
  }, [id]);

  const loadBillData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const allBills = await billService.getAllBills(tenantCode);
      const billData = allBills.find(b => b.id === parseInt(id));

      if (billData) {
        setBill(billData);
        const customerData = await customerService.getCustomerByMobile(tenantCode, billData.mobileNo);
        setCustomer(customerData);
      }
    } catch (error) {
      message.error('Failed to load bill data');
      console.error('Failed to load bill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      fresh: 'blue',
      pending: 'orange',
      closed: 'green',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      fresh: 'Fresh',
      pending: 'Pending',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      fresh: 'blue',
      in_progress: 'orange',
      completed: 'green',
      delivered: 'purple',
    };
    return colors[status] || 'default';
  };

  const orderColumns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => (
        <Button type="link" onClick={() => navigate(`/orders/${id}`)}>
          #{id}
        </Button>
      ),
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Total Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getOrderStatusColor(status)}>{status}</Tag>,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!bill) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Bill not found</p>
          <Button onClick={() => navigate('/bills')}>Back to Bills</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bills')}>
            Back
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate('/bills')}
          >
            Go to Bills
          </Button>
        </Space>
      </div>

      <Card title={`Bill #${bill.id}`} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Bill ID">{bill.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(bill.status)}>{getStatusLabel(bill.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {customer ? (
              <Button type="link" onClick={() => navigate(`/customers/${customer.mobileNo}`)}>
                {customer.name}
              </Button>
            ) : (
              bill.mobileNo
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{bill.mobileNo}</Descriptions.Item>
          <Descriptions.Item label="Created Date">
            {bill.createdDate ? dayjs(bill.createdDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Number of Orders">
            {bill.orders?.length || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <strong style={{ fontSize: '16px' }}>₹{bill.totalAmount.toFixed(2)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Advance Paid">₹{bill.advancePaid.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Balance Amount">
            <strong style={{ color: bill.balanceAmount > 0 ? '#ff4d4f' : '#52c41a' }}>
              ₹{bill.balanceAmount.toFixed(2)}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Discount">{bill.discount || '-'}</Descriptions.Item>
          <Descriptions.Item label="Remarks" span={2}>
            {bill.remarks || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {bill.orders && bill.orders.length > 0 && (
        <Card title={`Associated Orders (${bill.orders.length})`}>
          <Table columns={orderColumns} dataSource={bill.orders} rowKey="id" pagination={false} scroll={{ x: 600 }} />
        </Card>
      )}
    </div>
  );
};

export default BillView;
