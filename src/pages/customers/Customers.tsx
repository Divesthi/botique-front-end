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
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
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

  const handleDelete = async (customerId: number) => {
    try {
      await customerService.deleteCustomer(tenantCode, customerId);
      message.success('Customer deleted successfully');
      loadCustomers();
    } catch (error) {
      message.error('Failed to delete customer. They may have linked orders or measurements.');
      console.error('Failed to delete customer:', error);
    }
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
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      onHeaderCell: () => ({ style: { backgroundColor: '#F0E8E2' } }),
      onCell: () => ({ style: { backgroundColor: '#ffffff' } }),
      render: (_, record) => (
        <Popconfirm
          title="Delete Customer"
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
        <h1>Customer Management</h1>
        <Space wrap>
          <Input
            placeholder="Search by name or phone"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 250, minWidth: 180 }}
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
            dataSource={[...customers].sort((a, b) => {
              const aDate = a.updatedDate || a.creationDate;
              const bDate = b.updatedDate || b.creationDate;
              return dayjs(bDate || 0).valueOf() - dayjs(aDate || 0).valueOf();
            })}
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
              { pattern: /^\+?[0-9]{7,15}$/, message: 'Please enter a valid mobile number (7-15 digits, optional +country code)' },
            ]}
          >
            <Input placeholder="e.g. +14155552671 or 9876543210" maxLength={16} />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            name="alternateContactNo"
            label="Alternate Contact Number"
            rules={[
              { pattern: /^\+?[0-9]{7,15}$/, message: 'Please enter a valid mobile number (7-15 digits, optional +country code)' },
            ]}
          >
            <Input placeholder="e.g. +14155552671 or 9876543210" maxLength={16} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
