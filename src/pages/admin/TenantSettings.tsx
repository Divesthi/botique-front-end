import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  Spin,
  message,
  Tag,
  Form,
  Input,
  Switch,
  Alert,
  Typography,
  Modal,
  Skeleton,
  Divider,
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
  RightOutlined,
  ApiOutlined,
  EditOutlined,
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

// ── Types ─────────────────────────────────────────────────────────────────────
type ChannelOption = NotificationChannel | 'none';
type SettingsSection = 'notifications' | 'integrations';

// ── Instagram error messages ──────────────────────────────────────────────────
const INSTAGRAM_ERROR_MESSAGES: Record<string, { type: 'error' | 'info'; text: string }> = {
  no_ig_business_account: {
    type: 'error',
    text: 'No Instagram Business Account linked to your Facebook Page. Set this up in Meta Business Suite first.',
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

// ── Sub-components ────────────────────────────────────────────────────────────

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  badge?: 'connected' | 'warning' | 'none';
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon, label, description, active, badge, onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      border: 'none',
      borderRadius: 10,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.18s ease',
      background: active ? 'rgba(139,58,90,0.08)' : 'transparent',
      outline: active ? '1.5px solid rgba(139,58,90,0.2)' : '1.5px solid transparent',
    }}
  >
    <div style={{
      width: 38,
      height: 38,
      borderRadius: 9,
      background: active
        ? 'linear-gradient(135deg, #8B3A5A 0%, #5C2238 100%)'
        : '#F0E8E2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: 16,
      color: active ? '#E8D4A8' : '#8B3A5A',
      transition: 'all 0.18s ease',
    }}>
      {icon}
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontWeight: 600,
        fontSize: 13.5,
        color: active ? '#5C2238' : '#2D1B25',
        lineHeight: 1.3,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 11.5, color: '#7A6068', marginTop: 1, lineHeight: 1.3 }}>
        {description}
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {badge === 'connected' && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#52c41a',
          boxShadow: '0 0 0 2px rgba(82,196,26,0.2)',
        }} />
      )}
      {badge === 'warning' && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#faad14',
          boxShadow: '0 0 0 2px rgba(250,173,20,0.2)',
        }} />
      )}
      <RightOutlined style={{ fontSize: 10, color: '#B0A0A8' }} />
    </div>
  </button>
);

// ── Integration Card ──────────────────────────────────────────────────────────
interface IntegrationCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  status: 'connected' | 'disconnected' | 'loading' | 'error';
  statusLabel?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  icon, iconColor, title, description, status, statusLabel, children, actions,
}) => {
  const statusConfig = {
    connected: { color: '#52c41a', bg: 'rgba(82,196,26,0.08)', label: statusLabel || 'Connected' },
    disconnected: { color: '#7A6068', bg: '#F5F5F5', label: statusLabel || 'Not connected' },
    loading: { color: '#1890ff', bg: 'rgba(24,144,255,0.08)', label: 'Loading…' },
    error: { color: '#ff4d4f', bg: 'rgba(255,77,79,0.08)', label: statusLabel || 'Error' },
  }[status];

  return (
    <div style={{
      border: '1px solid #F0E8E2',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        gap: 14,
        borderBottom: children || actions ? '1px solid #F5F0EE' : 'none',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${iconColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color: iconColor,
          flexShrink: 0,
        }}>
          {icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, color: '#2D1B25' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: '#7A6068', marginTop: 2 }}>{description}</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 20,
          background: statusConfig.bg,
          fontSize: 12,
          fontWeight: 500,
          color: statusConfig.color,
          flexShrink: 0,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusConfig.color,
          }} />
          {statusConfig.label}
        </div>
      </div>

      {/* Body */}
      {(children || actions) && (
        <div style={{ padding: '16px 20px' }}>
          {children}
          {actions && <div style={{ marginTop: children ? 16 : 0 }}>{actions}</div>}
        </div>
      )}
    </div>
  );
};

// ── Instagram Section ─────────────────────────────────────────────────────────
interface InstagramSectionProps {
  tenantCode: string;
}

const InstagramSection: React.FC<InstagramSectionProps> = ({ tenantCode }) => {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const config = await tenantService.getInstagramConfig(tenantCode);
      setStatus(config);
    } catch {
      setStatus({ connected: false });
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const instagramParam = params.get('instagram');
    const reasonParam = params.get('reason');

    if (instagramParam === 'connected') {
      message.success('Instagram account connected successfully');
      window.history.replaceState({}, '', window.location.pathname);
      loadConfig();
    } else if (instagramParam === 'error' && reasonParam) {
      const errorInfo = INSTAGRAM_ERROR_MESSAGES[reasonParam] ?? {
        type: 'error', text: 'An unexpected error occurred. Please try again.',
      };
      errorInfo.type === 'error' ? message.error(errorInfo.text, 6) : message.info(errorInfo.text, 6);
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
      const { authUrl } = await tenantService.getInstagramAuthUrl(tenantCode);
      window.location.href = authUrl;
    } catch {
      message.error('Failed to initiate Instagram connection. Please try again.');
      setConnectLoading(false);
    }
  };

  const handleDisconnect = () => {
    Modal.confirm({
      title: 'Disconnect Instagram?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'You will not be able to post to Instagram until you reconnect.',
      okText: 'Disconnect',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDisconnectLoading(true);
          await tenantService.disconnectInstagram(tenantCode);
          setStatus({ connected: false });
          message.success('Instagram disconnected.');
        } catch (err: any) {
          message.error(
            err?.response?.status === 404
              ? 'No Instagram connection found.'
              : 'Failed to disconnect. Please try again.',
          );
        } finally {
          setDisconnectLoading(false);
        }
      },
    });
  };

  if (configLoading) {
    return (
      <IntegrationCard
        icon={<InstagramOutlined />}
        iconColor="#833ab4"
        title="Instagram"
        description="Post photos and carousels to your Instagram Business account"
        status="loading"
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </IntegrationCard>
    );
  }

  const connected = status?.connected === true;
  const config = connected ? (status as InstagramConfig) : null;
  const daysUntilExpiry = config ? dayjs(config.tokenExpiry).diff(dayjs(), 'day') : null;
  const expiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 15;

  return (
    <IntegrationCard
      icon={<InstagramOutlined />}
      iconColor="#833ab4"
      title="Instagram"
      description="Post photos and carousels to your Instagram Business account"
      status={connected ? (expiryWarning ? 'error' : 'connected') : 'disconnected'}
      statusLabel={
        connected
          ? expiryWarning
            ? `Expires in ${daysUntilExpiry}d`
            : config?.igUsername ? `@${config.igUsername}` : 'Connected'
          : 'Not connected'
      }
      actions={
        connected ? (
          <Space wrap>
            {expiryWarning && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12, width: '100%' }}
                message={`Token expires ${dayjs(config!.tokenExpiry).format('DD MMM YYYY')} — reconnect to avoid disruption.`}
              />
            )}
            <Button
              danger
              icon={<DisconnectOutlined />}
              loading={disconnectLoading}
              onClick={handleDisconnect}
              size="small"
            >
              Disconnect
            </Button>
            {expiryWarning && (
              <Button
                type="primary"
                icon={<LinkOutlined />}
                loading={connectLoading}
                onClick={handleConnect}
                size="small"
              >
                Reconnect
              </Button>
            )}
          </Space>
        ) : (
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
        )
      }
    >
      {connected && config && (
        <div style={{ fontSize: 12.5, color: '#7A6068' }}>
          Connected on {dayjs(config.connectedAt).format('DD MMM YYYY')}
          {config.igUsername && (
            <span style={{ marginLeft: 12, color: '#2D1B25', fontWeight: 500 }}>
              @{config.igUsername}
            </span>
          )}
        </div>
      )}
    </IntegrationCard>
  );
};

// ── Notification Channel Config ───────────────────────────────────────────────
interface NotificationsSectionProps {
  tenantCode: string;
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({ tenantCode }) => {
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>('none');
  const [savedChannel, setSavedChannel] = useState<ChannelOption>('none');

  const [whatsappForm] = Form.useForm<WhatsAppConfig>();
  const [whatsappLoaded, setWhatsappLoaded] = useState(false);
  const [whatsappEditing, setWhatsappEditing] = useState(false);
  const [hasWhatsappConfig, setHasWhatsappConfig] = useState(false);

  const [telegramForm] = Form.useForm<TelegramConfig>();
  const [telegramLoaded, setTelegramLoaded] = useState(false);
  const [telegramEditing, setTelegramEditing] = useState(false);
  const [hasTelegramConfig, setHasTelegramConfig] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tenant = await tenantService.getTenantByCode(tenantCode);
      const channel = (tenant.preferences?.notifications?.channel as NotificationChannel) ?? 'none';
      setSelectedChannel(channel as ChannelOption);
      setSavedChannel(channel as ChannelOption);

      if (channel === 'whatsapp') await loadWhatsAppConfig();
      else if (channel === 'telegram') await loadTelegramConfig();
    } catch {
      message.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const loadWhatsAppConfig = async () => {
    if (whatsappLoaded) return;
    const config = await tenantService.getWhatsAppConfig(tenantCode);
    if (config) { whatsappForm.setFieldsValue(config); setHasWhatsappConfig(true); }
    setWhatsappLoaded(true);
  };

  const loadTelegramConfig = async () => {
    if (telegramLoaded) return;
    const config = await tenantService.getTelegramConfig(tenantCode);
    if (config) { telegramForm.setFieldsValue(config); setHasTelegramConfig(true); }
    setTelegramLoaded(true);
  };

  const handleChannelChange = async (value: ChannelOption) => {
    setSelectedChannel(value);
    if (value === 'whatsapp') await loadWhatsAppConfig();
    if (value === 'telegram') await loadTelegramConfig();
  };

  const handleSaveChannel = async () => {
    try {
      setSavingPrefs(true);
      await tenantService.updatePreferences(tenantCode, {
        notifications: { channel: selectedChannel === 'none' ? null : selectedChannel },
      });
      setSavedChannel(selectedChannel);
      message.success('Notification channel saved');
    } catch {
      message.error('Failed to save channel');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveWhatsApp = async (values: WhatsAppConfig) => {
    try {
      setSavingConfig(true);
      await tenantService.saveWhatsAppConfig(tenantCode, values);
      setHasWhatsappConfig(true);
      setWhatsappEditing(false);
      message.success('WhatsApp configuration saved');
    } catch {
      message.error('Failed to save WhatsApp configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveTelegram = async (values: TelegramConfig) => {
    try {
      setSavingConfig(true);
      await tenantService.saveTelegramConfig(tenantCode, values);
      setHasTelegramConfig(true);
      setTelegramEditing(false);
      message.success('Telegram configuration saved');
    } catch {
      message.error('Failed to save Telegram configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const channelChanged = selectedChannel !== savedChannel;

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  const channelOptions: { value: ChannelOption; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { value: 'none', label: 'None', icon: '—', color: '#7A6068', desc: 'Notifications disabled' },
    {
      value: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppOutlined />,
      color: '#25D366',
      desc: 'Send via WhatsApp Business API',
    },
    {
      value: 'telegram',
      label: 'Telegram',
      icon: <SendOutlined />,
      color: '#229ED9',
      desc: 'Send via Telegram Bot',
    },
  ];

  return (
    <div>
      {/* Channel Picker */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#2D1B25', marginBottom: 4 }}>
          Notification channel
        </div>
        <div style={{ fontSize: 13, color: '#7A6068', marginBottom: 16 }}>
          Choose how order and delivery updates are sent to customers.
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {channelOptions.map((opt) => {
            const isActive = selectedChannel === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleChannelChange(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  border: isActive ? '1.5px solid #8B3A5A' : '1.5px solid #E8DDD8',
                  borderRadius: 10,
                  background: isActive ? 'rgba(139,58,90,0.06)' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  minWidth: 140,
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${opt.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: opt.color,
                }}>
                  {opt.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#2D1B25' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: '#7A6068' }}>{opt.desc}</div>
                </div>
                {isActive && (
                  <CheckCircleOutlined style={{
                    marginLeft: 'auto', color: '#8B3A5A', fontSize: 14,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {channelChanged && (
          <div style={{ marginTop: 12 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingPrefs}
              onClick={handleSaveChannel}
              size="small"
            >
              Save channel
            </Button>
            <Button
              size="small"
              style={{ marginLeft: 8 }}
              onClick={() => setSelectedChannel(savedChannel)}
            >
              Cancel
            </Button>
          </div>
        )}

        {!channelChanged && savedChannel !== 'none' && (
          <div style={{ marginTop: 10 }}>
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 20 }}>
              {savedChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram'} is active
            </Tag>
          </div>
        )}
      </div>

      {/* WhatsApp Config */}
      {selectedChannel === 'whatsapp' && (
        <>
          <Divider style={{ margin: '20px 0' }} />
          <IntegrationCard
            icon={<WhatsAppOutlined />}
            iconColor="#25D366"
            title="WhatsApp Business API"
            description="Configure your Meta Business credentials to send WhatsApp messages"
            status={hasWhatsappConfig ? 'connected' : 'disconnected'}
            statusLabel={hasWhatsappConfig ? 'Configured' : 'Not configured'}
            actions={
              hasWhatsappConfig && !whatsappEditing ? (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setWhatsappEditing(true)}
                >
                  Edit credentials
                </Button>
              ) : undefined
            }
          >
            {(!hasWhatsappConfig || whatsappEditing) && (
              <Form form={whatsappForm} layout="vertical" onFinish={handleSaveWhatsApp} initialValues={{ isActive: true }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Form.Item name="phoneNumberId" label="Phone Number ID" rules={[{ required: true }]}>
                    <Input placeholder="e.g. 1234567890" />
                  </Form.Item>
                  <Form.Item name="wabaId" label="WABA ID" rules={[{ required: true }]}>
                    <Input placeholder="e.g. 9876543210" />
                  </Form.Item>
                </div>
                <Form.Item name="accessToken" label="Access Token" rules={[{ required: true }]}>
                  <Input.Password placeholder="Enter access token" />
                </Form.Item>
                <Form.Item
                  name="businessPhoneNumber"
                  label="Business Phone Number"
                  rules={[{ required: true }]}
                  extra="Include country code — e.g. +919876543210"
                >
                  <Input placeholder="+919876543210" />
                </Form.Item>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingConfig} size="small">
                    Save credentials
                  </Button>
                  {whatsappEditing && (
                    <Button size="small" onClick={() => setWhatsappEditing(false)}>Cancel</Button>
                  )}
                </Space>
              </Form>
            )}
          </IntegrationCard>
        </>
      )}

      {/* Telegram Config */}
      {selectedChannel === 'telegram' && (
        <>
          <Divider style={{ margin: '20px 0' }} />
          <IntegrationCard
            icon={<SendOutlined />}
            iconColor="#229ED9"
            title="Telegram Bot"
            description="Configure your Telegram bot to send messages to a group or channel"
            status={hasTelegramConfig ? 'connected' : 'disconnected'}
            statusLabel={hasTelegramConfig ? 'Configured' : 'Not configured'}
            actions={
              hasTelegramConfig && !telegramEditing ? (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setTelegramEditing(true)}
                >
                  Edit credentials
                </Button>
              ) : undefined
            }
          >
            {(!hasTelegramConfig || telegramEditing) && (
              <Form form={telegramForm} layout="vertical" onFinish={handleSaveTelegram} initialValues={{ isActive: true }}>
                <Form.Item
                  name="botToken"
                  label="Bot Token"
                  rules={[{ required: true }]}
                  extra="Get this from @BotFather on Telegram"
                >
                  <Input.Password placeholder="e.g. 123456:ABC-DEF..." />
                </Form.Item>
                <Form.Item
                  name="chatId"
                  label="Chat ID"
                  rules={[{ required: true }]}
                  extra="The group or channel where notifications will be sent"
                >
                  <Input placeholder="e.g. -1001234567890" />
                </Form.Item>
                <Form.Item name="isActive" label="Active" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={savingConfig} size="small">
                    Save credentials
                  </Button>
                  {telegramEditing && (
                    <Button size="small" onClick={() => setTelegramEditing(false)}>Cancel</Button>
                  )}
                </Space>
              </Form>
            )}
          </IntegrationCard>
        </>
      )}
    </div>
  );
};

// ── Integrations Section ──────────────────────────────────────────────────────
const IntegrationsSection: React.FC<{ tenantCode: string }> = ({ tenantCode }) => (
  <div>
    <InstagramSection tenantCode={tenantCode} />
    {/* Future integrations slot in here as more <IntegrationCard>s */}
  </div>
);

// ── Main TenantSettings ───────────────────────────────────────────────────────
const TenantSettings: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const [activeSection, setActiveSection] = useState<SettingsSection>('notifications');

  useEffect(() => {
    if (code) loadTenant();
  }, [code]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const tenant = await tenantService.getTenantByCode(code!);
      setTenantName(tenant.name);
    } catch {
      message.error('Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems: {
    key: SettingsSection;
    icon: React.ReactNode;
    label: string;
    description: string;
  }[] = [
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      description: 'Channels & message delivery',
    },
    {
      key: 'integrations',
      icon: <ApiOutlined />,
      label: 'Integrations',
      description: 'Social media & third-party apps',
    },
  ];

  const sectionTitle: Record<SettingsSection, { title: string; subtitle: string }> = {
    notifications: {
      title: 'Notifications',
      subtitle: 'Configure how and where customer notifications are delivered.',
    },
    integrations: {
      title: 'Integrations',
      subtitle: 'Connect third-party platforms to extend your boutique\'s reach.',
    },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
        flexWrap: 'wrap',
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/tenants')}>
          Back
        </Button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Title level={3} style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
              Settings
            </Title>
            <Tag color="geekblue" style={{ fontWeight: 600, letterSpacing: 1, borderRadius: 20 }}>
              {code}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>{tenantName}</Text>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <div style={{
          width: 220,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #F0E8E2',
          padding: 10,
          boxShadow: '0 2px 8px rgba(139,58,90,0.04)',
        }}>
          <div style={{ padding: '8px 6px 10px', fontSize: 11, fontWeight: 600, color: '#B0A0A8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Settings
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size={4}>
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                description={item.description}
                active={activeSection === item.key}
                onClick={() => setActiveSection(item.key)}
              />
            ))}
          </Space>
        </div>

        {/* Content panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #F0E8E2',
            boxShadow: '0 2px 8px rgba(139,58,90,0.04)',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F5F0EE',
              background: '#FDFAF9',
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#2D1B25', fontFamily: "'Playfair Display', Georgia, serif" }}>
                {sectionTitle[activeSection].title}
              </div>
              <div style={{ fontSize: 13, color: '#7A6068', marginTop: 3 }}>
                {sectionTitle[activeSection].subtitle}
              </div>
            </div>

            {/* Panel body */}
            <div style={{ padding: '24px' }}>
              {code && activeSection === 'notifications' && (
                <NotificationsSection tenantCode={code} />
              )}
              {code && activeSection === 'integrations' && (
                <IntegrationsSection tenantCode={code} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;