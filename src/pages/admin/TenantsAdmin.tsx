import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Switch,
  message,
  Space,
  Tag,
  Empty,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { Tenant, TenantFormData } from '../../types';
import { tenantService } from '../../services/tenantService';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const TenantsAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch {
      message.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.phoneNumber || '').includes(q)
    );
  });

  const handleAdd = () => {
    setEditingTenant(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalVisible(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    form.setFieldsValue({
      ...tenant,
      startedDate: tenant.startedDate ? dayjs(tenant.startedDate) : undefined,
      churnedDate: tenant.churnedDate ? dayjs(tenant.churnedDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload: TenantFormData = {
        name: values.name,
        code: values.code,
        address: values.address,
        phoneNumber: values.phoneNumber,
        startedDate: values.startedDate ? values.startedDate.toISOString() : undefined,
        churnedDate: values.churnedDate ? values.churnedDate.toISOString() : undefined,
        active: values.active ?? true,
      };

      if (editingTenant) {
        await tenantService.updateTenant({ ...editingTenant, ...payload });
        message.success('Tenant updated successfully');
      } else {
        await tenantService.createTenant(payload);
        message.success('Tenant created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingTenant(null);
      loadTenants();
    } catch {
      message.error('Failed to save tenant');
    }
  };

  const columns: ColumnsType<Tenant> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => (
        <Tag color="geekblue" style={{ fontWeight: 600, letterSpacing: 1 }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      render: (v?: string) => v || '-',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: 'Started Date',
      dataIndex: 'startedDate',
      key: 'startedDate',
      width: 140,
      sorter: (a, b) => {
        if (!a.startedDate) return 1;
        if (!b.startedDate) return -1;
        return dayjs(a.startedDate).valueOf() - dayjs(b.startedDate).valueOf();
      },
      defaultSortOrder: 'descend',
      render: (date?: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Churned Date',
      dataIndex: 'churnedDate',
      key: 'churnedDate',
      width: 140,
      render: (date?: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.active === value,
      render: (active?: boolean) =>
        active ? (
          <Tag color="success">Active</Tag>
        ) : (
          <Tag color="error">Inactive</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      onHeaderCell: () => ({ style: { backgroundColor: '#F0E8E2' } }),
      onCell: () => ({ style: { backgroundColor: '#ffffff' } }),
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header-bar">
        <div>
          <h1 style={{ margin: 0 }}>Tenant Management</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
            Create and manage boutique tenants on the BQOM platform.
          </p>
        </div>
        <Space wrap>
          <Input
            placeholder="Search by name, code or phone"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 250, minWidth: 180 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Tenant
          </Button>
        </Space>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredTenants.length === 0 ? (
          <Empty description="No tenants found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTenants}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>

      <Modal
        title={editingTenant ? 'Edit Tenant' : 'Add Tenant'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingTenant(null);
        }}
        onOk={() => form.submit()}
        width="min(600px, calc(100vw - 32px))"
        okText={editingTenant ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tenant Name"
            rules={[{ required: true, message: 'Please enter tenant name' }]}
          >
            <Input placeholder="e.g. Priya Boutique" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Tenant Code"
            rules={[
              { required: true, message: 'Please enter tenant code' },
              { min: 2, message: 'Code must be at least 2 characters' },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: 'Only letters, numbers, hyphens and underscores allowed',
              },
            ]}
            extra="Unique identifier used to log in. Case-sensitive."
          >
            <Input
              placeholder="e.g. PRIYA01"
              disabled={!!editingTenant}
            />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              {
                pattern: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number',
              },
            ]}
          >
            <Input placeholder="10-digit phone number" maxLength={10} />
          </Form.Item>

          <Form.Item name="startedDate" label="Started Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="churnedDate" label="Churned Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="active" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantsAdmin;
