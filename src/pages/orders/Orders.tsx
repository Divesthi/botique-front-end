import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Empty,
  Spin,
  Tag,
  Divider,
  Space,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import type { Order, Customer, CustomerMeasurement, OrderItem } from '../../types';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import { measurementService } from '../../services/measurementService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [form] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  // Get filter from URL params
  const dashboardFilter = searchParams.get('filter');

  useEffect(() => {
    loadData();
  }, [searchTerm, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
      const toDate = dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

      const [ordersData, customersData, measurementsData] = await Promise.all([
        orderService.getAllOrders(tenantCode, searchTerm, fromDate, toDate),
        customerService.getAllCustomers(tenantCode),
        measurementService.getAllMeasurements(tenantCode),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setMeasurements(measurementsData);
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

  // Clear dashboard filter
  const clearDashboardFilter = () => {
    setSearchParams({});
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return `₹${safeAmount.toFixed(2)}`;
  };

  // Get filter label for display
  const getFilterLabel = (filter: string | null) => {
    const labels: Record<string, string> = {
      active: 'Active Orders (In Progress)',
      pending: 'Pending Orders (Overdue)',
      yet_to_deliver: 'Yet to be Delivered',
      delivered_today: 'Delivered Today',
      pending_delivery_today: 'Pending Delivery Today',
    };
    return filter ? labels[filter] || filter : '';
  };

  // Apply dashboard filter to orders
  const getFilteredOrders = () => {
    if (!dashboardFilter) return orders;

    switch (dashboardFilter) {
      case 'active':
        // Active orders: status is 'in_progress'
        return orders.filter((o) => o.status === 'in_progress');
      case 'pending':
        // Pending orders: status is 'fresh' or 'in_progress' and delivery date has passed
        return orders.filter(
          (o) =>
            (o.status === 'fresh' || o.status === 'in_progress') &&
            o.deliveryDate &&
            dayjs(o.deliveryDate).isBefore(dayjs(), 'day')
        );
      case 'yet_to_deliver':
        // Yet to be delivered: status is not 'delivered' and delivery date has passed
        return orders.filter(
          (o) =>
            o.status !== 'delivered' &&
            o.deliveryDate &&
            dayjs(o.deliveryDate).isBefore(dayjs(), 'day')
        );
      case 'delivered_today':
        // Delivered today: status is 'delivered' and deliveredDate is today
        return orders.filter(
          (o) =>
            o.status === 'delivered' &&
            o.deliveredDate &&
            dayjs(o.deliveredDate).isSame(dayjs(), 'day')
        );
      case 'pending_delivery_today':
        // Pending for delivery today: scheduled for today but not yet delivered
        return orders.filter(
          (o) =>
            (o.status === 'fresh' || o.status === 'in_progress' || o.status === 'completed') &&
            o.deliveryDate &&
            dayjs(o.deliveryDate).isSame(dayjs(), 'day')
        );
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const handleDelete = async (orderId: number) => {
    try {
      await orderService.deleteOrder(tenantCode, orderId);
      message.success('Order deleted successfully');
      loadData();
    } catch (error) {
      message.error('Failed to delete order');
      console.error('Failed to delete order:', error);
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setSelectedCustomer('');
    setModalVisible(true);
  };

  const handleCustomerChange = (mobileNo: string) => {
    setSelectedCustomer(mobileNo);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingOrder) {
        // Update existing order - prepare order items with costs
        const orderItems: OrderItem[] = (values.orderItems || []).map((item: any) => ({
          measurementId: item.measurementId,
          mobileNo: editingOrder.mobileNo,
          quantity: item.quantity,
          costPerQuantity: item.costPerQuantity,
          remarks: item.remarks,
          status: values.status === 'delivered' ? 'delivered' : (item.status || 'in_progress'),
          itemsCost: (item.itemsCost || []).map((cost: any) => ({
            cost: cost.cost,
            type: cost.type,
            mobileNo: editingOrder.mobileNo,
          })),
        }));

        const orderData: Order = {
          ...editingOrder,
          deliveryDate: values.deliveryDate ? values.deliveryDate.toISOString() : undefined,
          totalItems: values.totalItems,
          remarks: values.remarks,
          status: values.status,
          total: values.total,
          advance: values.advance,
          balance: values.balance,
          orderItems,
        };

        await orderService.updateOrder(tenantCode, orderData);
        message.success('Order updated successfully');
      } else {
        // Create new order
        const orderItems: OrderItem[] = (values.orderItems || []).map((item: any) => ({
          measurementId: item.measurementId,
          mobileNo: values.mobileNo,
          quantity: item.quantity,
          costPerQuantity: item.costPerQuantity,
          remarks: item.remarks,
          status: values.status,
          itemsCost: (item.itemsCost || []).map((cost: any) => ({
            cost: cost.cost,
            type: cost.type,
            mobileNo: values.mobileNo,
          })),
        }));

        const orderData = {
          mobileNo: values.mobileNo,
          deliveryDate: values.deliveryDate ? values.deliveryDate.toISOString() : undefined,
          totalItems: values.totalItems,
          remarks: values.remarks,
          status: values.status,
          total: values.total,
          advance: values.advance,
          balance: values.balance,
          orderItems,
        };

        await orderService.createOrder(tenantCode, orderData);
        message.success('Order created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingOrder(null);
      loadData();
    } catch (error) {
      message.error(editingOrder ? 'Failed to update order' : 'Failed to create order');
      console.error('Failed to save order:', error);
    }
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

  const getCustomerName = (mobileNo: string) => {
    const customer = customers.find((c) => c.mobileNo === mobileNo);
    return customer?.name || '-';
  };

  const customerMeasurements = measurements.filter((m) => m.mobileNo === selectedCustomer);

  const handleOrderFormValuesChange = (changedValues: any, allValues: any) => {
    // Auto-calculate balance = total - advance
    if ('total' in changedValues || 'advance' in changedValues) {
      const total = allValues.total || 0;
      const advance = allValues.advance || 0;
      form.setFieldValue('balance', Math.max(0, total - advance));
    }

    // Auto-populate costPerQuantity from cost breakdown sum
    if (changedValues.orderItems) {
      changedValues.orderItems.forEach((item: any, index: number) => {
        if (item && 'itemsCost' in item) {
          const costs = allValues.orderItems?.[index]?.itemsCost || [];
          const sum = costs.reduce((acc: number, c: any) => acc + (Number(c?.cost) || 0), 0);
          form.setFieldValue(['orderItems', index, 'costPerQuantity'], sum);
        }
      });
    }
  };

  const columns: ColumnsType<Order> = [
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
      title: 'Total Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      width: 120,
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
          title="Delete Order"
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
      <div className="page-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Order Management</h1>
          {dashboardFilter && (
            <Tag
              color="blue"
              closable
              onClose={clearDashboardFilter}
              style={{ fontSize: '14px', padding: '4px 8px' }}
            >
              {getFilterLabel(dashboardFilter)}
            </Tag>
          )}
        </div>
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
            placeholder={['Delivery From', 'Delivery To']}
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear
            style={{ minWidth: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Create Order
          </Button>
        </Space>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Empty description={dashboardFilter ? `No ${getFilterLabel(dashboardFilter).toLowerCase()} found` : 'No orders found'} />
        ) : (
          <Table
            columns={columns}
            dataSource={[...filteredOrders].sort((a, b) => {
              const aDate = a.updatedDate || a.receivedDate;
              const bDate = b.updatedDate || b.receivedDate;
              return dayjs(bDate || 0).valueOf() - dayjs(aDate || 0).valueOf();
            })}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1800 }}
            onRow={(record) => ({
              onClick: () => navigate(`/orders/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      <Modal
        title={editingOrder ? 'Edit Order' : 'Create Order'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedCustomer('');
          setEditingOrder(null);
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'fresh', advance: 0, balance: 0 }}
          onValuesChange={handleOrderFormValuesChange}
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
              disabled={!!editingOrder}
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
            name="totalItems"
            label="Total Items"
            rules={[{ required: true, message: 'Please enter total items' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter total items" />
          </Form.Item>

          <Form.Item
            name="deliveryDate"
            label="Delivery Date"
            rules={[{
              validator: (_, value) => {
                if (!value || value >= dayjs().startOf('day')) return Promise.resolve();
                return Promise.reject(new Error('Delivery date must be today or a future date'));
              },
            }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="total"
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

          <Form.Item name="advance" label="Advance Payment">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Enter advance payment"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item name="balance" label="Balance to be Paid">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%', backgroundColor: '#f5f5f5' }}
              prefix="₹"
              readOnly
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              options={[
                { value: 'fresh', label: 'Fresh' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'delivered', label: 'Delivered' },
              ]}
            />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>

          <Divider>Order Items</Divider>

          <Form.List name="orderItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={<MinusCircleOutlined onClick={() => remove(name)} />}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'measurementId']}
                      label="Measurement"
                      rules={[{ required: true, message: 'Please select measurement' }]}
                    >
                      <Select
                        placeholder="Select measurement"
                        disabled={!selectedCustomer}
                        options={customerMeasurements.map((m) => ({
                          value: m.id,
                          label: `${m.name} - ${m.dressType}`,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label="Quantity"
                      rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'costPerQuantity']}
                      label="Cost Per Quantity"
                      rules={[{ required: true, message: 'Please enter cost' }]}
                    >
                      <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="₹" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'remarks']} label="Remarks">
                      <Input placeholder="Item remarks" />
                    </Form.Item>

                    <Divider plain style={{ margin: '12px 0' }}>
                      Cost Breakdown
                    </Divider>

                    <Form.List name={[name, 'itemsCost']}>
                      {(costFields, { add: addCost, remove: removeCost }) => (
                        <>
                          {costFields.map(({ key: costKey, name: costName, ...costRestField }) => (
                            <Space key={costKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                              <Form.Item
                                {...costRestField}
                                name={[costName, 'type']}
                                rules={[{ required: true, message: 'Required' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="Type (e.g., Material)" style={{ width: 180 }} />
                              </Form.Item>
                              <Form.Item
                                {...costRestField}
                                name={[costName, 'cost']}
                                rules={[{ required: true, message: 'Required' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber placeholder="Cost" style={{ width: 150 }} min={0} step={0.01} prefix="₹" />
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => removeCost(costName)} style={{ color: '#ff4d4f' }} />
                            </Space>
                          ))}
                          <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                              type="dashed"
                              onClick={() => addCost()}
                              size="small"
                              icon={<PlusOutlined />}
                              style={{ width: '100%' }}
                            >
                              Add Cost Item
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    disabled={!selectedCustomer}
                  >
                    Add Order Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
