import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Select,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import type { CustomerMeasurement, Customer } from '../../types';
import { measurementService } from '../../services/measurementService';
import { customerService } from '../../services/customerService';
import { tenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const MEASUREMENT_FIELD_ORDER = [
  'Height', 'Shoulder', 'Arm', 'Upper Chest', 'Chest', 'Waist', 'Seat',
  'Side Open', 'Dot Point', 'High Bust Point', 'Front Neck', 'Back Neck',
  'Sleeve Length', 'Sleeve Loose', 'Pant Model', 'Knee Loose', 'Thigh Loose',
  'Pant Height', 'Hip', 'Ankle Loose',
];

const sortedMeasurementEntries = (measurement: Record<string, any>): [string, any][] => {
  const entries = Object.entries(measurement);
  const seen = new Set<string>();
  const ordered: [string, any][] = [];
  for (const key of MEASUREMENT_FIELD_ORDER) {
    if (!seen.has(key)) {
      const entry = entries.find(([k]) => k === key);
      if (entry) ordered.push(entry);
      seen.add(key);
    }
  }
  entries.forEach((entry) => {
    if (!seen.has(entry[0])) {
      ordered.push(entry);
      seen.add(entry[0]);
    }
  });
  return ordered;
};

const MeasurementView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';

  const [measurement, setMeasurement] = useState<CustomerMeasurement | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Share modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharePhoneNumber, setSharePhoneNumber] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareForm] = Form.useForm();

  useEffect(() => {
    loadMeasurementData();
  }, [id]);

  const loadMeasurementData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [allMeasurements, customersData] = await Promise.all([
        measurementService.getAllMeasurements(tenantCode),
        customerService.getAllCustomers(tenantCode),
      ]);
      const measurementData = allMeasurements.find((m) => m.id === parseInt(id));

      setCustomers(customersData);

      if (measurementData) {
        setMeasurement(measurementData);
        const customerData = await customerService.getCustomerByMobile(
          tenantCode,
          measurementData.mobileNo
        );
        setCustomer(customerData);
      }
    } catch (error) {
      message.error('Failed to load measurement data');
      console.error('Failed to load measurement data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Edit handlers ────────────────────────────────────────────────────────
  const handleEdit = () => {
    if (!measurement) return;

    const saved = measurement.measurement as Record<string, any>;
    const seen = new Set<string>();
    const measurementFields: { key: string; value: any }[] = [];

    for (const key of MEASUREMENT_FIELD_ORDER) {
      if (!seen.has(key)) {
        measurementFields.push({ key, value: saved[key] ?? '' });
        seen.add(key);
      }
    }
    Object.entries(saved).forEach(([key, value]) => {
      if (!seen.has(key)) {
        measurementFields.push({ key, value });
        seen.add(key);
      }
    });

    form.setFieldsValue({
      mobileNo: measurement.mobileNo,
      name: measurement.name,
      dressType: measurement.dressType,
      remarks: measurement.remarks,
      measurementFields,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (!measurement) return;

    try {
      const measurementObj: Record<string, any> = {};
      if (values.measurementFields) {
        values.measurementFields
          .filter(
            (field: { key: string; value: any }) =>
              field.value !== undefined &&
              field.value !== null &&
              String(field.value).trim() !== ''
          )
          .forEach((field: { key: string; value: any }) => {
            measurementObj[field.key] = field.value;
          });
      }

      const updatedMeasurement = {
        ...measurement,
        mobileNo: values.mobileNo,
        name: values.name,
        dressType: values.dressType,
        remarks: values.remarks,
        measurement: measurementObj,
      };

      await measurementService.updateMeasurement(tenantCode, updatedMeasurement);
      message.success('Measurement updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      loadMeasurementData();
    } catch (error) {
      message.error('Failed to update measurement');
      console.error('Failed to update measurement:', error);
    }
  };

  // ── Share handlers ───────────────────────────────────────────────────────
  const handleShareOpen = async () => {
    // Pre-fill with the boutique owner's phone number from the tenant profile
    let ownerPhone = '';
    try {
      const tenant = await tenantService.getTenantByCode(tenantCode);
      if (tenant?.phoneNumber) {
        // Ensure E.164 format expected by the API (+91XXXXXXXXXX)
        ownerPhone = tenant.phoneNumber.startsWith('+')
          ? tenant.phoneNumber
          : `+91${tenant.phoneNumber}`;
      }
    } catch {
      // Non-fatal — user can enter the number manually
    }

    setSharePhoneNumber(ownerPhone);
    shareForm.setFieldsValue({ toPhoneNumber: ownerPhone });
    setShareModalVisible(true);
  };

  const handleShareSubmit = async () => {
    if (!measurement?.id) return;

    try {
      await shareForm.validateFields();
    } catch {
      return; // Ant Design already shows field-level errors
    }

    const { toPhoneNumber } = shareForm.getFieldsValue();

    setSharing(true);
    try {
      await measurementService.shareMeasurement(tenantCode, measurement.id, toPhoneNumber);
      message.success('Measurement shared successfully!');
      setShareModalVisible(false);
      shareForm.resetFields();
    } catch (error) {
      message.error('Failed to share measurement. Please try again.');
      console.error('Failed to share measurement:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleShareCancel = () => {
    setShareModalVisible(false);
    shareForm.resetFields();
  };

  // ── Render guards ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!measurement) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Measurement not found</p>
          <Button onClick={() => navigate('/measurements')}>Back to Measurements</Button>
        </div>
      </Card>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* Action bar */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/measurements')}>
            Back
          </Button>

          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Edit Measurement
          </Button>

          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={handleShareOpen}
          >
            Share Measurement
          </Button>
        </Space>
      </div>

      {/* Measurement details card */}
      <Card title={`Measurement #${measurement.id}`} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Measurement ID">{measurement.id}</Descriptions.Item>
          <Descriptions.Item label="Name">{measurement.name}</Descriptions.Item>
          <Descriptions.Item label="Customer">
            {customer ? (
              <Button
                type="link"
                onClick={() => navigate(`/customers/${customer.mobileNo}`)}
              >
                {customer.name}
              </Button>
            ) : (
              measurement.mobileNo
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{measurement.mobileNo}</Descriptions.Item>
          <Descriptions.Item label="Dress Type">{measurement.dressType}</Descriptions.Item>
          <Descriptions.Item label="Created Date">
            {measurement.creationDate
              ? dayjs(measurement.creationDate).format('YYYY-MM-DD')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Remarks" span={2}>
            {measurement.remarks || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Measurements card */}
      <Card title="Measurements">
        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
          {(() => {
            const pantSectionKeys = new Set(
              MEASUREMENT_FIELD_ORDER.slice(
                MEASUREMENT_FIELD_ORDER.indexOf('Pant Model')
              )
            );
            const entries = sortedMeasurementEntries(measurement.measurement);
            const before = entries.filter(([key]) => !pantSectionKeys.has(key));
            const after = entries.filter(([key]) => pantSectionKeys.has(key));
            return (
              <>
                {before.length > 0 && (
                  <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                    {before.map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        {value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                )}
                {after.length > 0 && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                      {after.map(([key, value]) => (
                        <Descriptions.Item key={key} label={key}>
                          {value}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </Card>

      {/* ── Edit Measurement Modal ─────────────────────────────────────── */}
      <Modal
        title="Edit Measurement"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width="min(700px, calc(100vw - 32px))"
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="mobileNo"
            label="Customer"
            rules={[{ required: true, message: 'Please select customer' }]}
          >
            <Select
              showSearch
              placeholder="Select customer"
              disabled
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map((c) => ({
                value: c.mobileNo,
                label: `${c.name} (${c.mobileNo})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Measurement Name"
            rules={[{ required: true, message: 'Please enter measurement name' }]}
          >
            <Input placeholder="e.g., Blouse - Red" />
          </Form.Item>

          <Form.Item
            name="dressType"
            label="Dress Type"
            rules={[{ required: true, message: 'Please enter dress type' }]}
          >
            <Input placeholder="e.g., Blouse" />
          </Form.Item>

          <Divider>Measurements</Divider>

          <Form.List name="measurementFields">
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    maxHeight: 280,
                    overflowY: 'auto',
                    paddingRight: 4,
                    marginBottom: fields.length > 0 ? 8 : 0,
                  }}
                >
                  {fields.map(({ key, name, ...restField }) => {
                    const fieldKey = form.getFieldValue(['measurementFields', name, 'key']);
                    return (
                      <React.Fragment key={key}>
                        {fieldKey === 'Pant Model' && (
                          <Divider style={{ margin: '12px 0 8px' }} />
                        )}
                        <Space
                          style={{ display: 'flex', marginBottom: 8 }}
                          align="baseline"
                          wrap
                        >
                          <Form.Item
                            {...restField}
                            name={[name, 'key']}
                            rules={[{ required: true, message: 'Missing field name' }]}
                          >
                            <Input
                              placeholder="Field name (e.g., Shoulder)"
                              style={{ width: 180, minWidth: 140 }}
                            />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'value']}>
                            <Input
                              placeholder="Value (e.g., 15 inches)"
                              style={{ width: 180, minWidth: 140 }}
                            />
                          </Form.Item>
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: '#ff4d4f', fontSize: 16 }}
                          />
                        </Space>
                      </React.Fragment>
                    );
                  })}
                </div>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Measurement Field
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Share Measurement Modal ────────────────────────────────────── */}
      <Modal
        title="Share Measurement"
        open={shareModalVisible}
        onCancel={handleShareCancel}
        onOk={handleShareSubmit}
        okText="Share"
        okButtonProps={{ loading: sharing, icon: <ShareAltOutlined /> }}
        width="min(480px, calc(100vw - 32px))"
      >
        <p style={{ marginBottom: 16, color: '#7A6068' }}>
          The measurement details for{' '}
          <strong>{measurement.name}</strong> ({measurement.dressType}) will be
          sent to the boutique owner's phone number via WhatsApp.
        </p>

        <Form form={shareForm} layout="vertical">
          <Form.Item
            name="toPhoneNumber"
            label="Boutique Owner's Phone Number"
            rules={[
              { required: true, message: 'Please enter a phone number' },
              {
                pattern: /^\+[1-9]\d{7,14}$/,
                message: 'Enter a valid number in E.164 format (e.g. +919448488874)',
              },
            ]}
            extra="Include country code, e.g. +919448488874"
          >
            <Input
              placeholder="+919448488874"
              value={sharePhoneNumber}
              onChange={(e) => setSharePhoneNumber(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MeasurementView;
