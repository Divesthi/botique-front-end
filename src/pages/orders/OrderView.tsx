import React, { useEffect, useRef, useState } from 'react';
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
  Upload,
  Progress,
  Typography,
  Alert,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  InstagramOutlined,
  InboxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload';
import type { Order, Customer, CustomerMeasurement, OrderItem } from '../../types';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import { measurementService } from '../../services/measurementService';
import { tenantService, type InstagramStatus } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Text } = Typography;

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 10;
const MAX_CAPTION_LENGTH = 2200;
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Component ─────────────────────────────────────────────────────────────────
const OrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';

  // ── Order state ──────────────────────────────────────────────────────────
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Edit order modal ─────────────────────────────────────────────────────
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // ── Instagram post modal ─────────────────────────────────────────────────
  const [igModalVisible, setIgModalVisible] = useState(false);
  const [igFileList, setIgFileList] = useState<UploadFile[]>([]);
  const [igCaption, setIgCaption] = useState('');
  const [igPosting, setIgPosting] = useState(false);
  const [igUploadPercent, setIgUploadPercent] = useState(0);
  // Keeps the raw File references in insertion order, keyed by uid
  const igFilesRef = useRef<Map<string, File>>(new Map());
  const [igConfig, setIgConfig] = useState<InstagramStatus | null>(null);
  const [igConfigLoading, setIgConfigLoading] = useState(true);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadOrderData();
    loadInstagramConfig();
  }, [id]);

  const loadInstagramConfig = async () => {
    try {
      setIgConfigLoading(true);
      const config = await tenantService.getInstagramConfig(tenantCode);
      setIgConfig(config);
    } catch {
      setIgConfig({ connected: false });
    } finally {
      setIgConfigLoading(false);
    }
  };

  const loadOrderData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const allOrders = await orderService.getAllOrders(tenantCode);
      const orderData = allOrders.find((o) => o.id === parseInt(id));

      if (orderData) {
        setOrder(orderData);
        const customerData = await customerService.getCustomerByMobile(
          tenantCode,
          orderData.mobileNo,
        );
        setCustomer(customerData);
        const measurementsData = await measurementService.getMeasurementsByMobile(
          tenantCode,
          orderData.mobileNo,
        );
        setMeasurements(measurementsData);
      }
    } catch (error) {
      message.error('Failed to load order data');
      console.error('Failed to load order data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Status helpers ───────────────────────────────────────────────────────
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
    const measurement = measurements.find((m) => m.id === measurementId);
    if (!measurement) return { name: 'Unknown', dressType: '-', measurement: {} };
    return {
      name: measurement.name,
      dressType: measurement.dressType,
      measurement: measurement.measurement,
    };
  };

  // ── Edit order handlers ──────────────────────────────────────────────────
  const handleEdit = () => {
    if (!order) return;

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
      orderItems:
        order.orderItems?.map((item) => ({
          measurementId: item.measurementId,
          quantity: item.quantity,
          costPerQuantity: item.costPerQuantity,
          remarks: item.remarks,
          status: item.status,
          itemsCost:
            item.itemsCost?.map((cost) => ({
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
      const orderItems: OrderItem[] = (values.orderItems || []).map((item: any) => ({
        measurementId: item.measurementId,
        mobileNo: order.mobileNo,
        quantity: item.quantity,
        costPerQuantity: item.costPerQuantity,
        remarks: item.remarks,
        status:
          values.status === 'delivered' ? 'delivered' : item.status || 'in_progress',
        itemsCost: (item.itemsCost || []).map((cost: any) => ({
          cost: cost.cost,
          type: cost.type,
          mobileNo: order.mobileNo,
        })),
      }));

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
      loadOrderData();
    } catch (error) {
      message.error('Failed to update order');
      console.error('Failed to update order:', error);
    }
  };

  const igConnected = igConfig?.connected === true;
  const igDisabledReason = 'Instagram is not connected for this tenant. Connect it in Tenant Settings → Integrations.';

  // ── Instagram post handlers ──────────────────────────────────────────────

  /** Opens the Instagram post modal and resets all its state. */
  const handleOpenIgModal = () => {
    if (!igConnected) {
      message.warning('Instagram is not connected for this tenant. Connect it in Tenant Settings → Integrations.');
      return;
    }
    setIgFileList([]);
    setIgCaption('');
    setIgUploadPercent(0);
    igFilesRef.current.clear();
    setIgModalVisible(true);
  };

  /** Validates and tracks a file before it is added to the list. */
  const beforeUpload = (file: RcFile): boolean => {
    // Type check
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      message.error(`${file.name}: only JPEG and PNG files are supported.`);
      return false;
    }

    // Size check
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      message.error(
        `${file.name}: file size ${formatBytes(file.size)} exceeds the ${MAX_FILE_SIZE_MB} MB limit.`,
      );
      return false;
    }

    // Count check (current list + 1)
    if (igFilesRef.current.size >= MAX_IMAGES) {
      message.error(`You can attach a maximum of ${MAX_IMAGES} images per post.`);
      return false;
    }

    // Store the raw File so we can pass it to FormData later
    igFilesRef.current.set(file.uid, file);
    return false; // prevent antd's built-in upload — we handle it manually
  };

  /** Keeps antd's UploadFile list in sync and removes from our ref on delete. */
  const handleFileChange: UploadProps['onChange'] = ({ fileList }) => {
    // Purge removed files from our raw-file map
    const currentUids = new Set(fileList.map((f) => f.uid));
    igFilesRef.current.forEach((_, uid) => {
      if (!currentUids.has(uid)) igFilesRef.current.delete(uid);
    });
    setIgFileList(fileList);
  };

  /** Called when the user confirms the post. */
  const handlePostToInstagram = async () => {
    if (igFilesRef.current.size === 0) {
      message.warning('Please select at least one image before posting.');
      return;
    }

    const files = Array.from(igFilesRef.current.values());

    setIgPosting(true);
    setIgUploadPercent(0);

    try {
      await tenantService.postInstagramMedia(
        tenantCode,
        files,
        igCaption || undefined,
        (percent) => setIgUploadPercent(percent),
      );

      // 202 Accepted — background job started
      message.success(
        'Your post is being published to Instagram in the background. It will appear shortly.',
        6,
      );
      setIgModalVisible(false);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        message.error(
          'Invalid request. Please check that all images are valid JPEG/PNG files and try again.',
        );
      } else if (status === 401 || status === 403) {
        message.error(
          'Instagram account is not connected or the session has expired. Please reconnect in Tenant Settings.',
          6,
        );
      } else if (status === 404) {
        message.error('Instagram integration is not configured for this tenant.');
      } else {
        message.error('Failed to submit the post. Please try again later.');
      }
      console.error('Instagram post error:', error);
    } finally {
      setIgPosting(false);
    }
  };

  const handleCancelIgModal = () => {
    if (igPosting) return; // don't allow closing while uploading
    setIgModalVisible(false);
  };

  // ── Render guards ────────────────────────────────────────────────────────
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

  // ── Instagram modal content ───────────────────────────────────────────────
  const igImageCount = igFilesRef.current.size;
  const captionRemaining = MAX_CAPTION_LENGTH - igCaption.length;

  const igModalContent = (
    <div>
      {/* Upload area */}
      <Dragger
        multiple
        accept=".jpg,.jpeg,.png"
        fileList={igFileList}
        beforeUpload={beforeUpload}
        onChange={handleFileChange}
        listType="picture"
        disabled={igPosting}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#8B3A5A', fontSize: 32 }} />
        </p>
        <p className="ant-upload-text">
          Click or drag images here to upload
        </p>
        <p className="ant-upload-hint" style={{ color: '#999' }}>
          JPEG or PNG · Max {MAX_FILE_SIZE_MB} MB per file · Up to {MAX_IMAGES} images
        </p>
      </Dragger>

      {/* Image count feedback */}
      {igImageCount > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {igImageCount} image{igImageCount !== 1 ? 's' : ''} selected
            {igImageCount > 1 && ' — will be posted as a carousel'}
          </Text>
        </div>
      )}

      {/* Caption */}
      <Form layout="vertical">
        <Form.Item
          label="Caption"
          style={{ marginBottom: 4 }}
          extra={
            <Text
              type={captionRemaining < 100 ? 'warning' : 'secondary'}
              style={{ fontSize: 11 }}
            >
              {captionRemaining} characters remaining
            </Text>
          }
        >
          <TextArea
            rows={4}
            maxLength={MAX_CAPTION_LENGTH}
            placeholder="Write a caption for your post… (optional)"
            value={igCaption}
            onChange={(e) => setIgCaption(e.target.value)}
            disabled={igPosting}
            showCount={false}
            style={{ resize: 'none' }}
          />
        </Form.Item>
      </Form>

      {/* Upload progress — shown only while posting */}
      {igPosting && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Uploading images…
          </Text>
          <Progress
            percent={igUploadPercent}
            size="small"
            strokeColor={{ '0%': '#8B3A5A', '100%': '#C9A96E' }}
            status={igUploadPercent < 100 ? 'active' : 'success'}
          />
        </div>
      )}

      {/* Informational note */}
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="Publishing happens in the background. You'll see a confirmation once the request is accepted."
      />
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* Action bar */}
      <div style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
            Back
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Edit Order
          </Button>
          <Tooltip title={!igConnected && !igConfigLoading ? igDisabledReason : ''}>
            <Button
              icon={igConnected ? <InstagramOutlined /> : <WarningOutlined />}
              onClick={handleOpenIgModal}
              type="primary"
              disabled={!igConnected || igConfigLoading}
              loading={igConfigLoading}
            >
              Post in Instagram
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Order details card */}
      <Card title={`Order #${order.id}`} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Order ID">{order.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {customer ? (
              <Button
                type="link"
                onClick={() => navigate(`/customers/${customer.mobileNo}`)}
              >
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
            <strong style={{ fontSize: '16px' }}>₹{formatCurrency(order.total)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Advance Paid">₹{formatCurrency(order.advance)}</Descriptions.Item>
          <Descriptions.Item label="Balance Amount">₹{formatCurrency(order.balance)}</Descriptions.Item>
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
                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="Customer Name">
                    {measurementDetails.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dress Type">
                    {measurementDetails.dressType}
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity">{item.quantity}</Descriptions.Item>
                  <Descriptions.Item label="Cost Per Quantity">
                    ₹{formatCurrency(item.costPerQuantity)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Item Cost" span={2}>
                    <strong style={{ fontSize: '14px' }}>
                      {formatCurrency((item.quantity || 0) * (item.costPerQuantity || 0))}
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
                      <strong style={{ textTransform: 'capitalize' }}>{key}:</strong>{' '}
                      {value as string}
                    </div>
                  ))}
                </div>

                {item.itemsCost && item.itemsCost.length > 0 && (
                  <>
                    <Divider plain>Cost Breakdown</Divider>
                    <Table
                      dataSource={item.itemsCost}
                      pagination={false}
                      size="small"
                      rowKey={(record) => record.id || `${record.type}-${record.cost}`}
                      columns={[
                        { title: 'Cost Type', dataIndex: 'type', key: 'type', width: '40%' },
                        {
                          title: 'Amount',
                          dataIndex: 'cost',
                          key: 'cost',
                          width: '30%',
                          render: (cost: number) => `₹${formatCurrency(cost)}`,
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
                        const total = data.reduce((sum, i) => sum + (i.cost || 0), 0);
                        return (
                          <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                            <Table.Summary.Cell index={0}>
                              <strong>Total Cost Breakdown</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <strong>₹{formatCurrency(total)}</strong>
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

      {/* ── Instagram Post Modal ──────────────────────────────────────── */}
      <Modal
        title={
          <Space>
            <InstagramOutlined style={{ fontSize: 18, color: '#833ab4' }} />
            <span>Post in Instagram</span>
          </Space>
        }
        open={igModalVisible}
        onCancel={handleCancelIgModal}
        maskClosable={!igPosting}
        keyboard={!igPosting}
        footer={[
          <Button key="cancel" onClick={handleCancelIgModal} disabled={igPosting}>
            Cancel
          </Button>,
          <Button
            key="post"
            icon={<InstagramOutlined />}
            onClick={handlePostToInstagram}
            type="primary"
          >
            Post Now
          </Button>
        ]}
        width="min(560px, calc(100vw - 32px))"
        destroyOnClose
      >
        {igModalContent}
      </Modal>

      {/* ── Edit Order Modal ──────────────────────────────────────────── */}
      <Modal
        title={`Edit Order #${order?.id}`}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width="min(1000px, calc(100vw - 32px))"
        okText="Save Changes"
        okButtonProps={{ icon: <SaveOutlined /> }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Divider>Order Information</Divider>

          <Space style={{ width: '100%' }} size="large" wrap>
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

          <Space style={{ width: '100%' }} size="large" wrap>
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

          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item
              name="total"
              label="Total Amount"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: 150 }} placeholder="Total" prefix="₹" />
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

          <Divider>Order Items</Divider>

          <Form.List name="orderItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const measurementDetails = getMeasurementDetails(
                    form.getFieldValue(['orderItems', name, 'measurementId']),
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

                      <Space style={{ width: '100%' }} size="large" wrap>
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
                        <Form.Item {...restField} name={[name, 'status']} label="Status">
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
                            {costFields.map(
                              ({ key: costKey, name: costName, ...costRestField }) => (
                                <Space
                                  key={costKey}
                                  style={{ display: 'flex', marginBottom: 8 }}
                                  align="baseline"
                                  wrap
                                >
                                  <Form.Item
                                    {...costRestField}
                                    name={[costName, 'type']}
                                    rules={[{ required: true, message: 'Required' }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input
                                      placeholder="Type (e.g., Material)"
                                      style={{ width: 180 }}
                                    />
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
                              ),
                            )}
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
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
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