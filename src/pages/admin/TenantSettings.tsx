import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Modal,
  Skeleton,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  WhatsAppOutlined,
  SendOutlined,
  BellOutlined,
  CheckCircleOutlined,
  InstagramOutlined,
  LinkOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  tenantService,
  type WhatsAppConfig,
  type TelegramConfig,
  type NotificationChannel,
  type InstagramStatus,
  type InstagramConfig,
} from '../../services/tenantService';

const { Title, Text } = Typography;

type ChannelOption = NotificationChannel | 'none';

// ── Instagram error reason messages ──────────────────────────────────────────
const INSTAGRAM_ERROR_MESSAGES: Record<string, { type: 'error' | 'info'; text: string }> = {
  no_ig_business_account: {
    type: 'error',
    text: 'No Instagram Business Account is linked to your Facebook Page. Please set this up in Meta Business Suite first, then try again.',
  },
  token_exchange_failed: {
    type: 'error',
    text: 'Connection failed due to a Meta API error. Please try again.',
  },
  state_expired: {
    type: 'error',
    text: 'The login window expired. Please try connecting again.',
  },
  state_invalid: {
    type: 'error',
    text: 'Connection failed — invalid security token. Please try again.',
  },
  access_denied: {
    type: 'info',
    text: 'Connection cancelled. You can connect your Instagram account any time from this page.',
  },
};

// ── InstagramCard component ───────────────────────────────────────────────────
interface InstagramCardProps {
  tenantCode: string;
}

const InstagramCard: React.FC<InstagramCardProps> = ({ tenantCode }) => {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load instagram config on mount
  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const config = await tenantService.getInstagramConfig(tenantCode);
      setStatus(config);
    } catch {
      // If config fetch fails, treat as not connected
      setStatus({ connected: false });
    } finally {
      setConfigLoading(false);
    }
  };

  // Handle callback query params on mount
  useEffect(() => {
    const instagramParam = searchParams.get('instagram');
    const reasonParam = searchParams.get('reason');

    if (instagramParam === 'connected') {
      message.success('Instagram account connected successfully');
      // Clean URL immediately
      window.history.replaceState({}, '', window.location.pathname);
      // Load fresh config to show the connected account
      loadConfig();
    } else if (instagramParam === 'error' && reasonParam) {
      const errorInfo = INSTAGRAM_ERROR_MESSAGES[reasonParam] ?? {
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      };
      if (errorInfo.type === 'error') {
        message.error(errorInfo.text, 6);
      } else {
        message.info(errorInfo.text, 6);
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      loadConfig();
    } else {
      loadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    try {
      setConnectLoading(true);
      console.log(tenantService.getInstagramAuthUrl(tenantCode));
      const { authUrl } = await tenantService.getInstagramAuthUrl(tenantCode);
      window.location.href = authUrl;
    } catch {
      message.error('Failed to initiate Instagram connection. Please try again.');
      setConnectLoading(false);
    }
  };

  const handleDisconnect = () => {
    Modal.confirm({
      title: 'Disconnect Instagram Account?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content:
        'Are you sure you want to disconnect your Instagram account? You will not be able to post until you reconnect.',
      okText: 'Disconnect',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDisconnectLoading(true);
          await tenantService.disconnectInstagram(tenantCode);
          setStatus({ connected: false });
          message.success('Instagram account disconnected successfully.');
        } catch (err: any) {
          if (err?.response?.status === 404) {
            message.error('No Instagram connection found.');
          } else {
            message.error('Failed to disconnect. Please try again.');
          }
        } finally {
          setDisconnectLoading(false);
        }
      },
    });
  };

  // ── Expiry warning ──────────────────────────────────────────────────────────
  const renderExpiryWarning = (config: InstagramConfig) => {
    const daysUntilExpiry = dayjs(config.tokenExpiry).diff(dayjs(), 'day');
    if (daysUntilExpiry <= 15) {
      return (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          message={`Your connection will expire on ${dayjs(config.tokenExpiry).format('DD MMM YYYY')}. Reconnect to avoid disruption.`}
        />
      );
    }
    return null;
  };

  // ── Card body ───────────────────────────────────────────────────────────────
  const renderCardContent = () => {
    if (configLoading) {
      return (
        <div style={{ padding: '8px 0' }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      );
    }

    if (!status || !status.connected) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Connect your Instagram Business Account to enable posting directly from BQOM.
          </Text>
          <div>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              loading={connectLoading}
              onClick={handleConnect}
              style={{
                background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
                border: 'none',
              }}
            >
              Connect Instagram
            </Button>
          </div>
        </div>
      );
    }

    // Connected state
    const config = status as InstagramConfig;
    const displayName = config.igUsername ? `@${config.igUsername}` : `Account ID: ${config.igUserId}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ fontSize: 13, padding: '2px 10px' }}
          >
            Connected
          </Tag>
          <Text strong style={{ fontSize: 15 }}>
            {displayName}
          </Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Connected on {dayjs(config.connectedAt).format('DD MMM YYYY')}
        </Text>
        {renderExpiryWarning(config)}
        <div style={{ marginTop: 8 }}>
          <Button
            danger
            icon={<DisconnectOutlined />}
            loading={disconnectLoading}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <InstagramOutlined style={{ fontSize: 18, color: '#833ab4' }} />
          <span>Instagram</span>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
        Connect your Instagram Business Account to post content and manage your boutique's presence.
      </Text>
      {renderCardContent()}
    </Card>
  );
};

// ── Main TenantSettings component ─────────────────────────────────────────────
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

      {/* ── Instagram Card ──────────────────────────────────── */}
      {code && <InstagramCard tenantCode={code} />}

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

        {/* Save channel button */}
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
              <div>
                <Alert
                  type="success"
                  showIcon
                  message="WhatsApp is configured and ready."
                  style={{ marginBottom: 16 }}
                />
                <Button onClick={() => setWhatsappEditing(true)} style={{ marginRight: 8 }}>
                  Edit Configuration
                </Button>
              </div>
            ) : (
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
                <Button onClick={() => setTelegramEditing(true)}>Edit Configuration</Button>
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