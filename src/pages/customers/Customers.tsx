import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Empty,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantCode = user?.tenantCode || '';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllCustomers(tenantCode, searchTerm);
      setCustomers(data);
    } catch (error) {
      message.error('Failed to load customers');
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(tenantCode, { ...editingCustomer, ...values });
        message.success('Customer updated successfully');
      } else {
        await customerService.createCustomer(tenantCode, values);
        message.success('Customer created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      loadCustomers();
    } catch (error) {
      message.error('Failed to save customer');
      console.error('Failed to save customer:', error);
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id! - b.id!,
      defaultSortOrder: 'descend',
      render: (id: number, record: Customer) => (
        <Button type="link" onClick={() => navigate(`/customers/${record.mobileNo}`)}>
          #{id}
        </Button>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobileNo',
      key: 'mobileNo',
      width: 150,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Alternate Contact',
      dataIndex: 'alternateContactNo',
      key: 'alternateContactNo',
      width: 150,
    },
    {
      title: 'Created Date',
      dataIndex: 'creationDate',
      key: 'creationDate',
      width: 150,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
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
        <h1>Customer Management</h1>
        <Space>
          <Input
            placeholder="Search by name or phone"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 250 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Customer
          </Button>
        </Space>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : customers.length === 0 ? (
          <Empty description="No customers found" />
        ) : (
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => navigate(`/customers/${record.mobileNo}`),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
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
              { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit mobile number' },
            ]}
          >
            <Input placeholder="Enter 10-digit mobile number" maxLength={10} />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            name="alternateContactNo"
            label="Alternate Contact Number"
            rules={[
              { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit mobile number' },
            ]}
          >
            <Input placeholder="Enter 10-digit alternate contact number" maxLength={10} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
