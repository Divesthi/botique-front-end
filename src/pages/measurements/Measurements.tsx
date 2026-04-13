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
  message,
  Space,
  Empty,
  Spin,
  Divider,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import type { CustomerMeasurement, Customer } from '../../types';
import { measurementService } from '../../services/measurementService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
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

const Measurements: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<CustomerMeasurement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [measurementsData, customersData] = await Promise.all([
        measurementService.getAllMeasurements(tenantCode, searchTerm),
        customerService.getAllCustomers(tenantCode),
      ]);
      setMeasurements(measurementsData);
      setCustomers(customersData);
    } catch (error) {
      message.error('Failed to load data');
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_MEASUREMENT_FIELDS = MEASUREMENT_FIELD_ORDER;

  const handleAdd = () => {
    setEditingMeasurement(null);
    form.resetFields();
    form.setFieldsValue({
      measurementFields: DEFAULT_MEASUREMENT_FIELDS.map((name) => ({ key: name, value: '' })),
    });
    setModalVisible(true);
  };

  const handleDelete = async (measurementId: number) => {
    try {
      await measurementService.deleteMeasurement(tenantCode, measurementId);
      message.success('Measurement deleted successfully');
      loadData();
    } catch (error) {
      message.error('Failed to delete measurement');
      console.error('Failed to delete measurement:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Convert measurement fields array to object
      const measurement: Record<string, any> = {};
      if (values.measurementFields) {
        values.measurementFields
          .filter((field: { key: string; value: any }) => field.value !== undefined && field.value !== null && String(field.value).trim() !== '')
          .forEach((field: { key: string; value: any }) => {
            measurement[field.key] = field.value;
          });
      }

      const data = {
        mobileNo: values.mobileNo,
        dressType: values.dressType,
        name: values.name,
        measurement,
        remarks: values.remarks,
      };

      if (editingMeasurement) {
        await measurementService.updateMeasurement(tenantCode, { ...editingMeasurement, ...data });
        message.success('Measurement updated successfully');
      } else {
        await measurementService.createMeasurement(tenantCode, data);
        message.success('Measurement created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('Failed to save measurement');
      console.error('Failed to save measurement:', error);
    }
  };

  const getCustomerName = (mobileNo: string) => {
    const customer = customers.find((c) => c.mobileNo === mobileNo);
    return customer?.name || '-';
  };

  const columns: ColumnsType<CustomerMeasurement> = [
    {
      title: 'Customer Name',
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
      title: 'Measurement Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Dress Type',
      dataIndex: 'dressType',
      key: 'dressType',
      width: 150,
    },
    {
      title: 'Measurements',
      dataIndex: 'measurement',
      key: 'measurement',
      render: (measurement: Record<string, any>) => {
        if (!measurement || Object.keys(measurement).length === 0) return '-';
        const entries = sortedMeasurementEntries(measurement);
        const visible = entries.slice(0, 5);
        return (
          <div>
            {visible.map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
            {entries.length > 5 && (
              <div style={{ color: '#888', marginTop: 2 }}>
                +{entries.length - 5} more…
              </div>
            )}
          </div>
        );
      },
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
          title="Delete Measurement"
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
        <h1>Measurement Management</h1>
        <Space wrap>
          <Input
            placeholder="Search by name, phone, or dress type"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 280, minWidth: 180 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Measurement
          </Button>
        </Space>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : measurements.length === 0 ? (
          <Empty description="No measurements found" />
        ) : (
          <Table
            columns={columns}
            dataSource={[...measurements].sort((a, b) => {
              const aDate = a.updatedDate || a.creationDate;
              const bDate = b.updatedDate || b.creationDate;
              return dayjs(bDate || 0).valueOf() - dayjs(aDate || 0).valueOf();
            })}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1400 }}
            onRow={(record) => ({
              onClick: () => navigate(`/measurements/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      <Modal
        title={editingMeasurement ? 'Edit Measurement' : 'Add Measurement'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
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

export default Measurements;
