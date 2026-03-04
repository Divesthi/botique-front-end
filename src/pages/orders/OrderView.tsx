import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  message,
  Tag,
  Table,
  Divider,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  DatePicker,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, MinusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import type { Order, Customer, CustomerMeasurement, OrderItem } from '../../types';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import { measurementService } from '../../services/measurementService';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const OrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const allOrders = await orderService.getAllOrders(tenantCode);
      const orderData = allOrders.find(o => o.id === parseInt(id));

      if (orderData) {
        setOrder(orderData);
        const customerData = await customerService.getCustomerByMobile(tenantCode, orderData.mobileNo);
        setCustomer(customerData);

        // Load measurements for the customer
        const measurementsData = await measurementService.getMeasurementsByMobile(tenantCode, orderData.mobileNo);
        setMeasurements(measurementsData);
      }
    } catch (error) {
      message.error('Failed to load order data');
      console.error('Failed to load order data:', error);
    } finally {
      setLoading(false);
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

  const getMeasurementDetails = (measurementId: number) => {
    const measurement = measurements.find(m => m.id === measurementId);
    if (!measurement) return { name: 'Unknown', dressType: '-', measurement: {} };
    return {
      name: measurement.name,
      dressType: measurement.dressType,
      measurement: measurement.measurement,
    };
  };

  const handleEdit = () => {
    if (!order) return;

    // Prepare form data with ALL order fields
    const formData = {
      deliveryDate: order.deliveryDate ? dayjs(order.deliveryDate) : undefined,
      cuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : undefined,
      packagingDate: order.packagingDate ? dayjs(order.packagingDate) : undefined,
      totalItems: order.totalItems,
      total: order.total,
      advance: order.advance,
      balance: order.balance,
      status: order.status,
      remarks: order.remarks,
      orderItems: order.orderItems?.map((item) => ({
        measurementId: item.measurementId,
        quantity: item.quantity,
        costPerQuantity: item.costPerQuantity,
        remarks: item.remarks,
        status: item.status,
        itemsCost: item.itemsCost?.map((cost) => ({
          type: cost.type,
          cost: cost.cost,
        })) || [],
      })) || [],
    };

    form.setFieldsValue(formData);
    setEditModalVisible(true);
  };

  const handleSave = async (values: any) => {
    if (!order) return;

    try {
      // Prepare order items
      const orderItems: OrderItem[] = (values.orderItems || []).map((item: any) => ({
        measurementId: item.measurementId,
        mobileNo: order.mobileNo,
        quantity: item.quantity,
        costPerQuantity: item.costPerQuantity,
        remarks: item.remarks,
        status: item.status || 'in_progress',
        itemsCost: (item.itemsCost || []).map((cost: any) => ({
          cost: cost.cost,
          type: cost.type,
          mobileNo: order.mobileNo,
        })),
      }));

      // Prepare complete update data
      const updateData: Order = {
        ...order,
        deliveryDate: values.deliveryDate ? values.deliveryDate.toISOString() : undefined,
        cuttingDate: values.cuttingDate ? values.cuttingDate.toISOString() : undefined,
        packagingDate: values.packagingDate ? values.packagingDate.toISOString() : undefined,
        totalItems: values.totalItems,
        total: values.total,
        advance: values.advance,
        balance: values.balance,
        status: values.status,
        remarks: values.remarks,
        orderItems,
      };

      await orderService.updateOrder(tenantCode, updateData);
      message.success('Order updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      loadOrderData(); // Reload to show updated data
    } catch (error) {
      message.error('Failed to update order');
      console.error('Failed to update order:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Order not found</p>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
            Back
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            Edit Order
          </Button>
        </Space>
      </div>

      <Card title={`Order #${order.id}`} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Order ID">{order.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {customer ? (
              <Button type="link" onClick={() => navigate(`/customers/${customer.mobileNo}`)}>
                {customer.name}
              </Button>
            ) : (
              order.mobileNo
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{order.mobileNo}</Descriptions.Item>
          <Descriptions.Item label="Received Date">
            {order.receivedDate ? dayjs(order.receivedDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Delivery Date">
            {order.deliveryDate ? dayjs(order.deliveryDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Cutting Date">
            {order.cuttingDate ? dayjs(order.cuttingDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Packaging Date">
            {order.packagingDate ? dayjs(order.packagingDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Total Items">{order.totalItems}</Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <strong style={{ fontSize: '16px' }}>₹{order.total.toFixed(2)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Advance Paid">₹{order.advance.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Balance Amount">₹{order.balance.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Remarks" span={2}>
            {order.remarks || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Order Items Section */}
      {order.orderItems && order.orderItems.length > 0 && (
        <Card title="Order Items" style={{ marginBottom: 24 }}>
          {order.orderItems.map((item, index) => {
            const measurementDetails = getMeasurementDetails(item.measurementId);
            return (
              <Card
                key={item.id || index}
                type="inner"
                title={`Item ${index + 1}: ${measurementDetails.dressType}`}
                style={{ marginBottom: 16 }}
              >
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Customer Name">{measurementDetails.name}</Descriptions.Item>
                  <Descriptions.Item label="Dress Type">{measurementDetails.dressType}</Descriptions.Item>
                  <Descriptions.Item label="Quantity">{item.quantity}</Descriptions.Item>
                  <Descriptions.Item label="Cost Per Quantity">
                    ₹{item.costPerQuantity.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Item Cost" span={2}>
                    <strong style={{ fontSize: '14px' }}>
                      ₹{(item.quantity * item.costPerQuantity).toFixed(2)}
                    </strong>
                  </Descriptions.Item>
                  {item.remarks && (
                    <Descriptions.Item label="Remarks" span={2}>
                      {item.remarks}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Status" span={2}>
                    <Tag color={getStatusColor(item.status || 'fresh')}>
                      {getStatusLabel(item.status || 'fresh')}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                {/* Measurement Details */}
                <Divider plain>
                  Measurement Details
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate(`/measurements/${item.measurementId}`)}
                    style={{ marginLeft: 8 }}
                  >
                    View Full Measurement →
                  </Button>
                </Divider>
                <div style={{ padding: '0 16px' }}>
                  {Object.entries(measurementDetails.measurement || {}).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <strong style={{ textTransform: 'capitalize' }}>{key}:</strong> {value as string}
                    </div>
                  ))}
                </div>

                {/* Cost Breakdown */}
                {item.itemsCost && item.itemsCost.length > 0 && (
                  <>
                    <Divider plain>Cost Breakdown</Divider>
                    <Table
                      dataSource={item.itemsCost}
                      pagination={false}
                      size="small"
                      rowKey={(record) => record.id || `${record.type}-${record.cost}`}
                      columns={[
                        {
                          title: 'Cost Type',
                          dataIndex: 'type',
                          key: 'type',
                          width: '40%',
                        },
                        {
                          title: 'Amount',
                          dataIndex: 'cost',
                          key: 'cost',
                          width: '30%',
                          render: (cost: number) => `₹${cost.toFixed(2)}`,
                        },
                        {
                          title: 'Remarks',
                          dataIndex: 'remarks',
                          key: 'remarks',
                          width: '30%',
                          render: (remarks?: string) => remarks || '-',
                        },
                      ]}
                      summary={(data) => {
                        const total = data.reduce((sum, item) => sum + (item.cost || 0), 0);
                        return (
                          <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                            <Table.Summary.Cell index={0}>
                              <strong>Total Cost Breakdown</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <strong>₹{total.toFixed(2)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                          </Table.Summary.Row>
                        );
                      }}
                    />
                  </>
                )}
              </Card>
            );
          })}
        </Card>
      )}

      {/* Edit Order Modal */}
      <Modal
        title={`Edit Order #${order?.id}`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={1000}
        okText="Save Changes"
        okButtonProps={{ icon: <SaveOutlined /> }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {/* Main Order Details */}
          <Divider >Order Information</Divider>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="totalItems"
              label="Total Items"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={1} style={{ width: 120 }} placeholder="Total items" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Order Status"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                style={{ width: 150 }}
                options={[
                  { value: 'fresh', label: 'Fresh' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'delivered', label: 'Delivered' },
                ]}
              />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="deliveryDate" label="Delivery Date">
              <DatePicker style={{ width: 200 }} />
            </Form.Item>

            <Form.Item name="cuttingDate" label="Cutting Date">
              <DatePicker style={{ width: 200 }} />
            </Form.Item>

            <Form.Item name="packagingDate" label="Packaging Date">
              <DatePicker style={{ width: 200 }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="total"
              label="Total Amount"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: 150 }}
                placeholder="Total"
                prefix="₹"
              />
            </Form.Item>

            <Form.Item name="advance" label="Advance Payment">
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: 150 }}
                placeholder="Advance"
                prefix="₹"
              />
            </Form.Item>

            <Form.Item name="balance" label="Balance Amount">
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: 150 }}
                placeholder="Balance"
                prefix="₹"
              />
            </Form.Item>
          </Space>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} placeholder="Order remarks" />
          </Form.Item>

          <Divider >Order Items</Divider>

          <Form.List name="orderItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const measurementDetails = getMeasurementDetails(
                    form.getFieldValue(['orderItems', name, 'measurementId'])
                  );
                  return (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={`Item ${name + 1}: ${measurementDetails.dressType}`}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      }
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'measurementId']}
                        label="Measurement"
                        rules={[{ required: true, message: 'Please select measurement' }]}
                      >
                        <Select
                          placeholder="Select measurement"
                          options={measurements.map((m) => ({
                            value: m.id,
                            label: `${m.name} - ${m.dressType}`,
                          }))}
                        />
                      </Form.Item>

                      <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber min={1} style={{ width: 120 }} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'costPerQuantity']}
                          label="Cost Per Quantity"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber min={0} step={0.01} style={{ width: 150 }} prefix="₹" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'status']}
                          label="Status"
                        >
                          <Select
                            style={{ width: 150 }}
                            options={[
                              { value: 'fresh', label: 'Fresh' },
                              { value: 'in_progress', label: 'In Progress' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'delivered', label: 'Delivered' },
                            ]}
                          />
                        </Form.Item>
                      </Space>

                      <Form.Item {...restField} name={[name, 'remarks']} label="Remarks">
                        <Input.TextArea rows={2} placeholder="Item remarks" />
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
                                  <InputNumber
                                    placeholder="Cost"
                                    style={{ width: 150 }}
                                    min={0}
                                    step={0.01}
                                    prefix="₹"
                                  />
                                </Form.Item>
                                <MinusCircleOutlined
                                  onClick={() => removeCost(costName)}
                                  style={{ color: '#ff4d4f' }}
                                />
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
                  );
                })}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
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

export default OrderView;
