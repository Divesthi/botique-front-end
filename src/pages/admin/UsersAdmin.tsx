import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, message, Space, Tag, Spin, Empty } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import type { AuthUser, Tenant } from '../../types';
import { userService } from '../../services/userService';
import { tenantService } from '../../services/tenantService';
import type { ColumnsType } from 'antd/es/table';

const UsersAdmin: React.FC = () => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, tenantsData] = await Promise.all([
                userService.getAllUsers(),
                tenantService.getAllTenants()
            ]);
            setUsers(usersData);
            setTenants(tenantsData);
        } catch {
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            (u.email || '').toLowerCase().includes(q) ||
            (u.displayName || '').toLowerCase().includes(q) ||
            (u.tenantCode || '').toLowerCase().includes(q)
        );
    });

    const handleAdd = () => {
        form.resetFields();
        form.setFieldsValue({ role: 'TENANT_USER' });
        setModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            await userService.createUser({
                email: values.email,
                displayName: values.displayName,
                phoneNumber: values.phoneNumber,
                role: values.role,
                tenantCode: values.tenantCode,
            });
            message.success('User registered successfully.');
            setModalVisible(false);
            form.resetFields();
            loadData();
        } catch (error: any) {
            if (error.response?.data?.message) {
                message.error(`Failed to create user: ${error.response.data.message}`);
            } else {
                message.error('Failed to create user');
            }
        }
    };

    const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
        try {
            await userService.updateUserStatus(userId, !currentStatus);
            message.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            loadData();
        } catch {
            message.error('Failed to update user status');
        }
    };

    const columns: ColumnsType<AuthUser> = [
        {
            title: 'Display Name',
            dataIndex: 'displayName',
            key: 'displayName',
            width: 200,
            render: (text) => (
                <Space>
                    <UserOutlined style={{ color: '#888' }} />
                    <span style={{ fontWeight: 500 }}>{text}</span>
                </Space>
            ),
            sorter: (a, b) => a.displayName.localeCompare(b.displayName),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 250,
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Phone',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 150,
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: 150,
            render: (role: string) => {
                let color = 'default';
                if (role === 'PLATFORM_ADMIN') color = 'purple';
                else if (role === 'TENANT_ADMIN') color = 'blue';
                else if (role === 'TENANT_USER') color = 'cyan';
                return <Tag color={color}>{role.replace('_', ' ')}</Tag>;
            },
            filters: [
                { text: 'Platform Admin', value: 'PLATFORM_ADMIN' },
                { text: 'Tenant Admin', value: 'TENANT_ADMIN' },
                { text: 'Tenant User', value: 'TENANT_USER' },
            ],
            onFilter: (value, record) => record.role === value,
        },
        {
            title: 'Tenant Code',
            dataIndex: 'tenantCode',
            key: 'tenantCode',
            width: 150,
            render: (code: string) => (
                <Tag color="geekblue" style={{ fontWeight: 600, letterSpacing: 1 }}>
                    {code}
                </Tag>
            ),
            sorter: (a, b) => a.tenantCode.localeCompare(b.tenantCode),
        },
        {
            title: 'Status',
            key: 'status',
            width: 120,
            render: (_, record: any) => (
                <Switch
                    checked={record.active !== false}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    onChange={() => handleStatusToggle(record.id, record.active !== false)}
                    disabled={record.role === 'PLATFORM_ADMIN'} // Harder to disable platform admins
                />
            ),
        },
    ];

    return (
        <div>
            <div className="page-header-bar">
                <div>
                    <h1 style={{ margin: 0 }}>User Management</h1>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
                        Manage platform and tenant users, assign roles, and control access.
                    </p>
                </div>
                <Space wrap>
                    <Input
                        placeholder="Search by email, name or tenant"
                        prefix={<SearchOutlined />}
                        allowClear
                        style={{ width: 250, minWidth: 180 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Create User
                    </Button>
                </Space>
            </div>

            <Card>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <Empty description="No users found" />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        rowKey="id"
                        pagination={{ pageSize: 15, showSizeChanger: false }}
                        scroll={{ x: 1000 }}
                    />
                )}
            </Card>

            <Modal
                title="Create New User"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width="min(500px, calc(100vw - 32px))"
                okText="Add User"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please enter user email' },
                            { type: 'email', message: 'Please enter a valid email address' },
                        ]}
                    >
                        <Input placeholder="e.g. user@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="displayName"
                        label="Display Name"
                        rules={[{ required: true, message: 'Please enter display name' }]}
                    >
                        <Input placeholder="e.g. John Doe" />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label="Phone Number"
                        rules={[{ required: false }]}
                    >
                        <Input placeholder="e.g. +1234567890" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="User Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select>
                            <Select.Option value="TENANT_ADMIN">Tenant Admin</Select.Option>
                            <Select.Option value="TENANT_USER">Tenant User</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="tenantCode"
                        label="Assign to Tenant"
                        rules={[{ required: true, message: 'Please select a tenant' }]}
                        extra="The boutique this user belongs to."
                    >
                        <Select
                            showSearch
                            placeholder="Select a tenant"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={tenants.map(t => ({ value: t.code, label: `${t.name} (${t.code})` }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsersAdmin;
