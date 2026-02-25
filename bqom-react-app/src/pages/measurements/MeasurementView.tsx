import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, message, Modal, Form, Input, Select, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { CustomerMeasurement, Customer } from '../../types';
import { measurementService } from '../../services/measurementService';
import { customerService } from '../../services/customerService';
import { useTenant } from '../../context/TenantContext';
import dayjs from 'dayjs';

const MeasurementView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantCode } = useTenant();
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
      // Convert measurement object to measurementFields array for the form
      const measurementFields = Object.entries(measurement.measurement).map(([key, value]) => ({
        key,
        value,
      }));

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
        values.measurementFields.forEach((field: { key: string; value: any }) => {
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
        <Descriptions bordered column={2}>
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
          <Descriptions bordered column={2}>
            {Object.entries(measurement.measurement).map(([key, value]) => (
              <Descriptions.Item key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                {value}
              </Descriptions.Item>
            ))}
          </Descriptions>
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
        width={700}
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
            <Select
              placeholder="Select dress type"
              options={[
                { value: 'Blouse', label: 'Blouse' },
                { value: 'Saree', label: 'Saree' },
                { value: 'Churidar', label: 'Churidar' },
                { value: 'Lehenga', label: 'Lehenga' },
                { value: 'Dress', label: 'Dress' },
                { value: 'Skirt', label: 'Skirt' },
                { value: 'Other', label: 'Other' },
              ]}
            />
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
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'Missing field name' }]}
                      >
                        <Input placeholder="Field name (e.g., Shoulder)" style={{ width: 220 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Missing value' }]}
                      >
                        <Input placeholder="Value (e.g., 15 inches)" style={{ width: 220 }} />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: '#ff4d4f', fontSize: 16 }}
                      />
                    </Space>
                  ))}
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
