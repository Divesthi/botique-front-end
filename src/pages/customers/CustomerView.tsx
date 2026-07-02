import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, message, Table, Tag, Modal, Form, Input } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import type { Customer, Order, CustomerMeasurement } from '../../types';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import { measurementService } from '../../services/measurementService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const CustomerView: React.FC = () => {
  const { mobileNo } = useParams<{ mobileNo: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomerData();
  }, [mobileNo]);

  const loadCustomerData = async () => {
    if (!mobileNo) return;

    try {
      setLoading(true);
      const [customerData, measurementsData] = await Promise.all([
        customerService.getCustomerByMobile(tenantCode, mobileNo),
        measurementService.getMeasurementsByMobile(tenantCode, mobileNo),
      ]);
      setCustomer(customerData);
      setMeasurements(measurementsData);

      // Get all orders and filter by mobile number
      const allOrders = await orderService.getAllOrders(tenantCode);
      setOrders(allOrders.filter(o => o.mobileNo === mobileNo));
    } catch (error) {
      message.error('Failed to load customer data');
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (customer) {
      form.setFieldsValue(customer);
      setEditModalVisible(true);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!customer) return;

    try {
      await customerService.updateCustomer(tenantCode, { ...customer, ...values });
      message.success('Customer updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      loadCustomerData();
    } catch (error) {
      message.error('Failed to update customer');
      console.error('Failed to update customer:', error);
    }
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

  const measurementColumns: ColumnsType<CustomerMeasurement> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => (
        <Button type="link" onClick={() => navigate(`/measurements/${id}`)}>
          #{id}
        </Button>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Dress Type',
      dataIndex: 'dressType',
      key: 'dressType',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: 'Created',
      dataIndex: 'creationDate',
      key: 'creationDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Customer not found</p>
          <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
            Back
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Edit Customer
          </Button>
        </Space>
      </div>

      <Card title="Customer Details" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="ID">{customer.id}</Descriptions.Item>
          <Descriptions.Item label="Name">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{customer.mobileNo}</Descriptions.Item>
          <Descriptions.Item label="Alternate Contact">
            {customer.alternateContactNo || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {customer.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Created Date">
            {customer.creationDate ? dayjs(customer.creationDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Measurements (${measurements.length})`} style={{ marginBottom: 24 }}>
        {measurements.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No measurements found</p>
        ) : (
          <Table
            columns={measurementColumns}
            dataSource={measurements}
            rowKey="id"
            pagination={false}
            scroll={{ x: 600 }}
          />
        )}
      </Card>

      <Card title={`Orders (${orders.length})`}>
        {orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No orders found</p>
        ) : (
          <Table columns={orderColumns} dataSource={orders} rowKey="id" pagination={false} scroll={{ x: 600 }} />
        )}
      </Card>

      <Modal
        title="Edit Customer"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width="min(600px, calc(100vw - 32px))"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>

          <Form.Item
            name="mobileNo"
            label="Mobile Number"
            rules={[
              { required: true, message: 'Please enter mobile number' },
              { pattern: /^\+?[0-9]{7,15}$/, message: 'Please enter a valid mobile number (7-15 digits, optional +country code)' },
            ]}
          >
            <Input placeholder="e.g. +14155552671 or 9876543210" maxLength={16} disabled />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            name="alternateContactNo"
            label="Alternate Contact Number"
            rules={[
              { pattern: /^\+?[0-9]{7,15}$/, message: 'Please enter a valid mobile number (7-15 digits, optional +country code)' },
            ]}
          >
            <Input placeholder="e.g. +14155552671 or 9876543210" maxLength={16} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerView;
