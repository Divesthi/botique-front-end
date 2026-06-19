import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Spin,
  message,
  Tag,
  Form,
  Input,
  Switch,
  Divider,
  Radio,
  Alert,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  WhatsAppOutlined,
  SendOutlined,
  BellOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  tenantService,
  type WhatsAppConfig,
  type TelegramConfig,
  type NotificationChannel,
} from '../../services/tenantService';

const { Title, Text } = Typography;

type ChannelOption = NotificationChannel | 'none';

const TenantSettings: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Channel selection
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>('none');
  const [savedChannel, setSavedChannel] = useState<ChannelOption>('none');

  // WhatsApp
  const [whatsappForm] = Form.useForm<WhatsAppConfig>();
  const [whatsappLoaded, setWhatsappLoaded] = useState(false);
  const [whatsappEditing, setWhatsappEditing] = useState(false);
  const [hasWhatsappConfig, setHasWhatsappConfig] = useState(false);

  // Telegram
  const [telegramForm] = Form.useForm<TelegramConfig>();
  const [telegramLoaded, setTelegramLoaded] = useState(false);
  const [telegramEditing, setTelegramEditing] = useState(false);
  const [hasTelegramConfig, setHasTelegramConfig] = useState(false);

  useEffect(() => {
    if (code) loadTenantData();
  }, [code]);

  const loadTenantData = async () => {
    if (!code) return;
    try {
      setLoading(true);
      const tenant = await tenantService.getTenantByCode(code);
      setTenantName(tenant.name);

      const channel =
        (tenant.preferences?.notifications?.channel as NotificationChannel) ?? 'none';
      setSelectedChannel(channel as ChannelOption);
      setSavedChannel(channel as ChannelOption);

      // Pre-load config for the active channel
      if (channel === 'whatsapp') {
        await loadWhatsAppConfig();
      } else if (channel === 'telegram') {
        await loadTelegramConfig();
      }
    } catch {
      message.error('Failed to load tenant settings');
    } finally {
      setLoading(false);
    }
  };

  const loadWhatsAppConfig = async () => {
    if (!code || whatsappLoaded) return;
    const config = await tenantService.getWhatsAppConfig(code);
    if (config) {
      whatsappForm.setFieldsValue(config);
      setHasWhatsappConfig(true);
    }
    setWhatsappLoaded(true);
  };

  const loadTelegramConfig = async () => {
    if (!code || telegramLoaded) return;
    const config = await tenantService.getTelegramConfig(code);
    if (config) {
      telegramForm.setFieldsValue(config);
      setHasTelegramConfig(true);
    }
    setTelegramLoaded(true);
  };

  // When user switches channel selection, lazy-load that channel's config
  const handleChannelChange = async (value: ChannelOption) => {
    setSelectedChannel(value);
    if (value === 'whatsapp' && !whatsappLoaded) await loadWhatsAppConfig();
    if (value === 'telegram' && !telegramLoaded) await loadTelegramConfig();
  };

  const handleSaveChannel = async () => {
    if (!code) return;
    try {
      setSavingPrefs(true);
      const channel = selectedChannel === 'none' ? null : selectedChannel;
      await tenantService.updatePreferences(code, {
        notifications: { channel },
      });
      setSavedChannel(selectedChannel);
      message.success('Notification channel saved successfully');
    } catch {
      message.error('Failed to save notification channel');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveWhatsApp = async (values: WhatsAppConfig) => {
    if (!code) return;
    try {
      setSavingConfig(true);
      await tenantService.saveWhatsAppConfig(code, values);
      setHasWhatsappConfig(true);
      setWhatsappEditing(false);
      message.success('WhatsApp configuration saved successfully');
    } catch {
      message.error('Failed to save WhatsApp configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveTelegram = async (values: TelegramConfig) => {
    if (!code) return;
    try {
      setSavingConfig(true);
      await tenantService.saveTelegramConfig(code, values);
      setHasTelegramConfig(true);
      setTelegramEditing(false);
      message.success('Telegram configuration saved successfully');
    } catch {
      message.error('Failed to save Telegram configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const channelChanged = selectedChannel !== savedChannel;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/tenants')}>
          Back
        </Button>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Tenant Settings
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {tenantName}
            <Tag color="geekblue" style={{ marginLeft: 8, fontWeight: 600, letterSpacing: 1 }}>
              {code}
            </Tag>
          </Text>
        </div>
      </div>

      {/* ── Notifications Feature Card ──────────────────────── */}
      <Card
        title={
          <Space>
            <BellOutlined style={{ color: '#8B3A5A' }} />
            <span>Notifications</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
          Select the channel through which order and delivery notifications will be sent to customers.
        </Text>

        {/* Channel Radio Group */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            Notification Channel
          </Text>
          <Radio.Group
            value={selectedChannel}
            onChange={(e) => handleChannelChange(e.target.value as ChannelOption)}
          >
            <Space direction="vertical" size={12}>
              <Radio value="none">
                <Space>
                  <span>None</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (Disable notifications)
                  </Text>
                </Space>
              </Radio>
              <Radio value="whatsapp">
                <Space>
                  <WhatsAppOutlined style={{ color: '#25D366', fontSize: 16 }} />
                  <span>WhatsApp</span>
                </Space>
              </Radio>
              <Radio value="telegram">
                <Space>
                  <SendOutlined style={{ color: '#229ED9', fontSize: 16 }} />
                  <span>Telegram</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* Save channel button — only show when changed */}
        {channelChanged && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="You have unsaved channel changes"
            action={
              <Button
                size="small"
                type="primary"
                icon={<SaveOutlined />}
                loading={savingPrefs}
                onClick={handleSaveChannel}
              >
                Save Channel
              </Button>
            }
          />
        )}

        {!channelChanged && savedChannel !== 'none' && (
          <div style={{ marginBottom: 16 }}>
            <Tag icon={<CheckCircleOutlined />} color="success">
              {savedChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram'} is the active channel
            </Tag>
          </div>
        )}

        {/* ── WhatsApp Config ─────────────────────────────── */}
        {selectedChannel === 'whatsapp' && (
          <>
            <Divider style={{ margin: '20px 0 16px' }}>
              <Space>
                <WhatsAppOutlined style={{ color: '#25D366' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>WhatsApp Configuration</span>
              </Space>
            </Divider>

            {hasWhatsappConfig && !whatsappEditing ? (
              /* Read-only summary */
              <div>
                <Alert
                  type="success"
                  showIcon
                  message="WhatsApp is configured and ready."
                  style={{ marginBottom: 16 }}
                />
                <Button
                  onClick={() => setWhatsappEditing(true)}
                  style={{ marginRight: 8 }}
                >
                  Edit Configuration
                </Button>
              </div>
            ) : (
              /* Edit form */
              <Form
                form={whatsappForm}
                layout="vertical"
                onFinish={handleSaveWhatsApp}
                initialValues={{ isActive: true }}
              >
                <Form.Item
                  name="phoneNumberId"
                  label="Phone Number ID"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. 1234567890" />
                </Form.Item>

                <Form.Item
                  name="wabaId"
                  label="WhatsApp Business Account ID (WABA ID)"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. 9876543210" />
                </Form.Item>

                <Form.Item
                  name="accessToken"
                  label="Access Token"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input.Password placeholder="Enter access token" />
                </Form.Item>

                <Form.Item
                  name="businessPhoneNumber"
                  label="Business Phone Number"
                  rules={[{ required: true, message: 'Required' }]}
                  extra="Include country code, e.g. +919876543210"
                >
                  <Input placeholder="+919876543210" />
                </Form.Item>

                <Form.Item name="isActive" label="Active" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={savingConfig}
                  >
                    Save Configuration
                  </Button>
                  {whatsappEditing && (
                    <Button onClick={() => setWhatsappEditing(false)}>Cancel</Button>
                  )}
                </Space>
              </Form>
            )}
          </>
        )}

        {/* ── Telegram Config ─────────────────────────────── */}
        {selectedChannel === 'telegram' && (
          <>
            <Divider style={{ margin: '20px 0 16px' }}>
              <Space>
                <SendOutlined style={{ color: '#229ED9' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Telegram Configuration</span>
              </Space>
            </Divider>

            {hasTelegramConfig && !telegramEditing ? (
              <div>
                <Alert
                  type="success"
                  showIcon
                  message="Telegram is configured and ready."
                  style={{ marginBottom: 16 }}
                />
                <Button onClick={() => setTelegramEditing(true)}>
                  Edit Configuration
                </Button>
              </div>
            ) : (
              <Form
                form={telegramForm}
                layout="vertical"
                onFinish={handleSaveTelegram}
                initialValues={{ isActive: true }}
              >
                <Form.Item
                  name="botToken"
                  label="Bot Token"
                  rules={[{ required: true, message: 'Required' }]}
                  extra="Get this from @BotFather on Telegram"
                >
                  <Input.Password placeholder="e.g. 123456:ABC-DEF..." />
                </Form.Item>

                <Form.Item
                  name="chatId"
                  label="Chat ID"
                  rules={[{ required: true, message: 'Required' }]}
                  extra="The group or channel chat ID where notifications will be sent"
                >
                  <Input placeholder="e.g. -1001234567890" />
                </Form.Item>

                <Form.Item name="isActive" label="Active" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={savingConfig}
                  >
                    Save Configuration
                  </Button>
                  {telegramEditing && (
                    <Button onClick={() => setTelegramEditing(false)}>Cancel</Button>
                  )}
                </Space>
              </Form>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default TenantSettings;
