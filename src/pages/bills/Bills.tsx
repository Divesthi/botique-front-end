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
  DatePicker,
  message,
  Space,
  Empty,
  Spin,
  Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import type { Bill, Customer, Order } from '../../types';
import { billService } from '../../services/billService';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [searchTerm, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
      const toDate = dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

      const [billsData, customersData, ordersData] = await Promise.all([
        billService.getAllBills(tenantCode, searchTerm, fromDate, toDate),
        customerService.getAllCustomers(tenantCode),
        orderService.getAllOrders(tenantCode),
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

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setDateRange(dates);
  };

  const handleDelete = async (billId: number) => {
    try {
      await billService.deleteBill(tenantCode, billId);
      message.success('Bill deleted successfully');
      loadData();
    } catch (error) {
      message.error('Failed to delete bill');
      console.error('Failed to delete bill:', error);
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
    form.setFieldsValue({ orderIds: [], totalAmount: undefined, advancePaid: 0, balanceAmount: undefined });
  };

  const handleBillFormValuesChange = (changedValues: any, allValues: any) => {
    if ('orderIds' in changedValues) {
      const selectedOrderIds: number[] = allValues.orderIds || [];
      const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id!));
      const totalAmount = selectedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const advancePaid = selectedOrders.reduce((sum, o) => sum + (o.advance || 0), 0);
      const balanceAmount = totalAmount - advancePaid;
      form.setFieldsValue({ totalAmount, advancePaid, balanceAmount });
    }
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
        await billService.updateBill(tenantCode, { ...editingBill, ...billData });
        message.success('Bill updated successfully');
      } else {
        await billService.createBill(tenantCode, billData);
        message.success('Bill created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setSelectedCustomer('');
      loadData();

      if (values.status === 'closed' && selectedOrders.length > 0) {
        try {
          await Promise.all(
            selectedOrders
              .filter((o) => o.status !== 'delivered')
              .map((o) => orderService.updateOrder(tenantCode, {
                ...o,
                status: 'delivered',
                orderItems: undefined, // Let backend cascade delivered status in-place
              }))
          );
        } catch (orderError) {
          message.warning('Bill saved, but failed to update some order statuses.');
          console.error('Failed to update order statuses:', orderError);
        }
      }
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

  const billedOrderIds = new Set(
    bills
      .filter((b) => !editingBill || b.id !== editingBill.id)
      .flatMap((b) => b.orders?.map((o) => o.id) ?? [])
  );

  const customerOrders = orders.filter(
    (o) => o.mobileNo === selectedCustomer && !billedOrderIds.has(o.id)
  );

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
      width: 80,
      fixed: 'right',
      onHeaderCell: () => ({ style: { backgroundColor: '#F0E8E2' } }),
      onCell: () => ({ style: { backgroundColor: '#ffffff' } }),
      render: (_, record) => (
        <Popconfirm
          title="Delete Bill"
          description="Are you sure? This cannot be undone."
          onConfirm={(e) => { e?.stopPropagation(); handleDelete(record.id!); }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div
        className="page-header-bar"
      >
        <h1>Bill Management</h1>
        <Space wrap>
          <Input
            placeholder="Search by customer name or phone"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 240, minWidth: 180 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <RangePicker
            placeholder={['Created From', 'Created To']}
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear
            style={{ minWidth: 200 }}
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
            dataSource={[...bills].sort((a, b) => {
              const aDate = a.updatedDate || a.createdDate;
              const bDate = b.updatedDate || b.createdDate;
              return dayjs(bDate || 0).valueOf() - dayjs(aDate || 0).valueOf();
            })}
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
          onValuesChange={handleBillFormValuesChange}
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
              placeholder="Auto-populated from orders"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item name="advancePaid" label="Advance Paid">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Auto-populated from orders"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item name="balanceAmount" label="Balance Amount">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Auto-populated from orders"
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
