import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Empty,
  Spin,
  Tag,
  Descriptions,
} from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { Bill, Customer, Order } from '../../types';
import { billService } from '../../services/billService';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billsData, customersData, ordersData] = await Promise.all([
        billService.getAllBills(searchTerm),
        customerService.getAllCustomers(),
        orderService.getAllOrders(),
      ]);
      setBills(billsData);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (error) {
      message.error('Failed to load data');
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBill(null);
    setSelectedCustomer('');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setSelectedCustomer(bill.mobileNo);
    form.setFieldsValue({
      ...bill,
      orderIds: bill.orders?.map((o) => o.id),
    });
    setModalVisible(true);
  };

  const handleCustomerChange = (mobileNo: string) => {
    setSelectedCustomer(mobileNo);
    form.setFieldsValue({ orderIds: [] });
  };

  const handleSubmit = async (values: any) => {
    try {
      const selectedOrders = values.orderIds
        ? orders.filter((o) => values.orderIds.includes(o.id))
        : [];

      const billData = {
        mobileNo: values.mobileNo,
        totalAmount: values.totalAmount,
        advancePaid: values.advancePaid,
        balanceAmount: values.balanceAmount,
        status: values.status,
        discount: values.discount,
        remarks: values.remarks,
        orders: selectedOrders,
      };

      if (editingBill) {
        await billService.updateBill({ ...editingBill, ...billData });
        message.success('Bill updated successfully');
      } else {
        await billService.createBill(billData);
        message.success('Bill created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedCustomer('');
      loadData();
    } catch (error) {
      message.error('Failed to save bill');
      console.error('Failed to save bill:', error);
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

  const getCustomerName = (mobileNo: string) => {
    const customer = customers.find((c) => c.mobileNo === mobileNo);
    return customer?.name || '-';
  };

  const customerOrders = orders.filter((o) => o.mobileNo === selectedCustomer);

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      fresh: 'blue',
      in_progress: 'orange',
      completed: 'green',
      delivered: 'purple',
    };
    return colors[status] || 'default';
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      fresh: 'Fresh',
      in_progress: 'In Progress',
      completed: 'Completed',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  const expandedRowRender = (record: Bill) => {
    const orderColumns: ColumnsType<Order> = [
      {
        title: 'Order ID',
        dataIndex: 'id',
        key: 'id',
        width: 100,
      },
      {
        title: 'Received Date',
        dataIndex: 'receivedDate',
        key: 'receivedDate',
        width: 150,
        render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      },
      {
        title: 'Delivery Date',
        dataIndex: 'deliveryDate',
        key: 'deliveryDate',
        width: 150,
        render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
      },
      {
        title: 'Total Items',
        dataIndex: 'totalItems',
        key: 'totalItems',
        width: 120,
      },
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        width: 120,
        render: (amount: number) => `₹${amount.toFixed(2)}`,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (status: string) => (
          <Tag color={getOrderStatusColor(status)}>{getOrderStatusLabel(status)}</Tag>
        ),
      },
      {
        title: 'Remarks',
        dataIndex: 'remarks',
        key: 'remarks',
        ellipsis: true,
      },
    ];

    return (
      <Table
        columns={orderColumns}
        dataSource={record.orders || []}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  const columns: ColumnsType<Bill> = [
    {
      title: 'Bill ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: (a, b) => a.id! - b.id!,
      defaultSortOrder: 'descend',
      render: (id: number) => (
        <Button type="link" onClick={(e) => {
          e.stopPropagation();
          navigate(`/bills/${id}`);
        }}>
          #{id}
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'mobileNo',
      key: 'customerName',
      width: 180,
      sorter: (a, b) => getCustomerName(a.mobileNo).localeCompare(getCustomerName(b.mobileNo)),
      render: (mobileNo: string) => getCustomerName(mobileNo),
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobileNo',
      key: 'mobileNo',
      width: 150,
    },
    {
      title: 'Orders',
      key: 'orders',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">
            {record.orders?.length || 0} Order{record.orders?.length !== 1 ? 's' : ''}
          </Tag>
          {record.orders && record.orders.length > 0 && (
            <Space size="small" wrap>
              {record.orders.map((o) => (
                <Button
                  key={o.id}
                  type="link"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${o.id}`);
                  }}
                >
                  #{o.id}
                </Button>
              ))}
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
      sorter: (a, b) => {
        if (!a.createdDate) return 1;
        if (!b.createdDate) return -1;
        return dayjs(a.createdDate).valueOf() - dayjs(b.createdDate).valueOf();
      },
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Advance Paid',
      dataIndex: 'advancePaid',
      key: 'advancePaid',
      width: 150,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Balance',
      dataIndex: 'balanceAmount',
      key: 'balanceAmount',
      width: 150,
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1>Bill Management</h1>
        <Space>
          <Input
            placeholder="Search by customer name or phone"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 280 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Create Bill
          </Button>
        </Space>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : bills.length === 0 ? (
          <Empty description="No bills found" />
        ) : (
          <Table
            columns={columns}
            dataSource={bills}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1600 }}
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => (record.orders?.length || 0) > 0,
            }}
            onRow={(record) => ({
              onClick: () => navigate(`/bills/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      <Modal
        title={editingBill ? 'Edit Bill' : 'Create Bill'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'fresh', advancePaid: 0, balanceAmount: 0 }}
        >
          <Form.Item
            name="mobileNo"
            label="Customer"
            rules={[{ required: true, message: 'Please select customer' }]}
          >
            <Select
              showSearch
              placeholder="Select customer"
              optionFilterProp="children"
              onChange={handleCustomerChange}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map((customer) => ({
                value: customer.mobileNo,
                label: `${customer.name} (${customer.mobileNo})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="orderIds"
            label="Associated Orders"
            rules={[{ required: true, message: 'Please select at least one order' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select orders to include in this bill"
              disabled={!selectedCustomer}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customerOrders.map((order) => ({
                value: order.id,
                label: `Order #${order.id} - ${dayjs(order.receivedDate).format('YYYY-MM-DD')} - ₹${order.total.toFixed(2)} (${order.status})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="Total Amount"
            rules={[{ required: true, message: 'Please enter total amount' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Enter total amount"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item name="advancePaid" label="Advance Paid">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Enter advance paid"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item name="balanceAmount" label="Balance Amount">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Enter balance amount"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item name="discount" label="Discount">
            <Input placeholder="e.g., 10% or ₹100" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              options={[
                { value: 'fresh', label: 'Fresh' },
                { value: 'pending', label: 'Pending' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Bills;
