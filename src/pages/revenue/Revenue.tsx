import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, Spin, Tag, Typography, Space } from 'antd';
import {
    DollarOutlined,
    RiseOutlined,
    ArrowUpOutlined,
    UserOutlined,
    CrownOutlined,
} from '@ant-design/icons';
import { billService } from '../../services/billService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import type { Bill, Customer } from '../../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text } = Typography;

const Revenue: React.FC = () => {
    const { user } = useAuth();
    const tenantCode = user?.tenantCode || '';
    const [bills, setBills] = useState<Bill[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [billsData, customersData] = await Promise.all([
                billService.getAllBills(tenantCode),
                customerService.getAllCustomers(tenantCode),
            ]);
            setBills(billsData);
            setCustomers(customersData);
        } catch (error) {
            console.error('Failed to load revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Statistics Calculations ────────────────────────────────

    // Total Revenue
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    // Revenue this Month
    const currentMonth = dayjs().startOf('month');
    const monthRevenue = bills
        .filter((b) => dayjs(b.createdDate).isAfter(currentMonth) || dayjs(b.createdDate).isSame(currentMonth, 'month'))
        .reduce((sum, b) => sum + b.totalAmount, 0);

    // Revenue this Week
    const currentWeek = dayjs().startOf('week');
    const weekRevenue = bills
        .filter((b) => dayjs(b.createdDate).isAfter(currentWeek) || dayjs(b.createdDate).isSame(currentWeek, 'week'))
        .reduce((sum, b) => sum + b.totalAmount, 0);

    // Top 5 Customers of the current month
    const currentMonthBills = bills.filter((b) =>
        dayjs(b.createdDate).isSame(dayjs(), 'month')
    );

    const customerRevenueMap = currentMonthBills.reduce((acc, bill) => {
        acc[bill.mobileNo] = (acc[bill.mobileNo] || 0) + bill.totalAmount;
        return acc;
    }, {} as Record<string, number>);

    const topCustomers = Object.entries(customerRevenueMap)
        .map(([mobileNo, revenue]) => {
            const customer = customers.find((c) => c.mobileNo === mobileNo);
            return {
                mobileNo,
                name: customer?.name || 'Unknown',
                totalRevenue: revenue,
                orderCount: currentMonthBills.filter(b => b.mobileNo === mobileNo).length
            };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

    const columns = [
        {
            title: 'Rank',
            key: 'rank',
            width: 80,
            render: (_: any, __: any, index: number) => (
                <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'orange' : 'default'} style={{ fontWeight: 'bold' }}>
                    #{index + 1}
                </Tag>
            ),
        },
        {
            title: 'Customer Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => (
                <Space>
                    <UserOutlined />
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: 'Mobile Number',
            dataIndex: 'mobileNo',
            key: 'mobileNo',
        },
        {
            title: 'Orders (This Month)',
            dataIndex: 'orderCount',
            key: 'orderCount',
            align: 'center' as const,
        },
        {
            title: 'Total Value',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            align: 'right' as const,
            render: (val: number) => (
                <Text type="success" strong>
                    ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading analytics..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '0 0 24px 0' }}>
            <Title level={2}>Revenue Analytics</Title>
            <Text type="secondary">Detailed financial performance for {user?.tenantName || user?.tenantCode}</Text>

            <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="revenue-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', borderRadius: '12px' }}>
                        <Statistic
                            title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Revenue</span>}
                            value={totalRevenue}
                            precision={2}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
                        />
                        <div style={{ marginTop: 12, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Lifetime earnings</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <Statistic
                            title="Revenue This Month"
                            value={monthRevenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ArrowUpOutlined />}
                        />
                        <Tag color="success" style={{ marginTop: 8 }}>{dayjs().format('MMMM YYYY')}</Tag>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <Statistic
                            title="Revenue This Week"
                            value={weekRevenue}
                            precision={2}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<RiseOutlined />}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Current week breakdown</Text>
                    </Card>
                </Col>
            </Row>

            <Card
                title={
                    <span>
                        <CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />
                        Top 5 High-Value Customers ({dayjs().format('MMMM')})
                    </span>
                }
                bordered={false}
                style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            >
                <Table
                    dataSource={topCustomers}
                    columns={columns}
                    pagination={false}
                    rowKey="mobileNo"
                />
            </Card>
        </div>
    );
};

export default Revenue;
