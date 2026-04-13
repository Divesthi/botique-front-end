import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, message, Modal, Form, Input, Select, Divider } from 'antd'; // Select kept for customer dropdown
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { CustomerMeasurement, Customer } from '../../types';
import { measurementService } from '../../services/measurementService';
import { customerService } from '../../services/customerService';
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
  entries.forEach((entry) => { if (!seen.has(entry[0])) { ordered.push(entry); seen.add(entry[0]); } });
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

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
      const measurementData = allMeasurements.find(m => m.id === parseInt(id));

      setCustomers(customersData);

      if (measurementData) {
        setMeasurement(measurementData);
        const customerData = await customerService.getCustomerByMobile(tenantCode, measurementData.mobileNo);
        setCustomer(customerData);
      }
    } catch (error) {
      message.error('Failed to load measurement data');
      console.error('Failed to load measurement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (measurement) {
      const saved = measurement.measurement as Record<string, any>;
      const seen = new Set<string>();
      const measurementFields: { key: string; value: any }[] = [];

      // Add all default fields in order, with saved values where present
      for (const key of MEASUREMENT_FIELD_ORDER) {
        if (!seen.has(key)) {
          measurementFields.push({ key, value: saved[key] ?? '' });
          seen.add(key);
        }
      }
      // Append any extra custom fields not in the default order
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
    }
  };

  const handleSubmit = async (values: any) => {
    if (!measurement) return;

    try {
      // Convert measurementFields array back to measurement object
      const measurementObj: Record<string, any> = {};
      if (values.measurementFields) {
        values.measurementFields
          .filter((field: { key: string; value: any }) => field.value !== undefined && field.value !== null && String(field.value).trim() !== '')
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/measurements')}>
            Back
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Edit Measurement
          </Button>
        </Space>
      </div>

      <Card title={`Measurement #${measurement.id}`} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Measurement ID">{measurement.id}</Descriptions.Item>
          <Descriptions.Item label="Name">{measurement.name}</Descriptions.Item>
          <Descriptions.Item label="Customer">
            {customer ? (
              <Button type="link" onClick={() => navigate(`/customers/${customer.mobileNo}`)}>
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

      <Card title="Measurements">
        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
          {(() => {
            const pantSectionKeys = new Set(
              MEASUREMENT_FIELD_ORDER.slice(MEASUREMENT_FIELD_ORDER.indexOf('Pant Model'))
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
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
              options={customers.map((customer) => ({
                value: customer.mobileNo,
                label: `${customer.name} (${customer.mobileNo})`,
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
                      {fieldKey === 'Pant Model' && <Divider style={{ margin: '12px 0 8px' }} />}
                      <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline" wrap>
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'Missing field name' }]}
                      >
                        <Input placeholder="Field name (e.g., Shoulder)" style={{ width: 180, minWidth: 140 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                      >
                        <Input placeholder="Value (e.g., 15 inches)" style={{ width: 180, minWidth: 140 }} />
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
    </div>
  );
};

export default MeasurementView;
