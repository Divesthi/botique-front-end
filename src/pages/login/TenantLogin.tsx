import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

/* ── Needle + Thread SVG Illustration ─────────────────────── */
const BoutiqueIllustration: React.FC = () => (
  <svg
    width="260"
    height="260"
    viewBox="0 0 260 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.18))' }}
  >
    {/* ── Thread Spool ───────────────────────────────────── */}
    {/* Spool bottom cap */}
    <ellipse cx="68" cy="198" rx="32" ry="13" fill="#C9A96E" opacity="0.9" />
    {/* Spool body */}
    <rect x="36" y="168" width="64" height="30" rx="6" fill="#C9A96E" opacity="0.85" />
    {/* Spool top cap */}
    <ellipse cx="68" cy="168" rx="32" ry="13" fill="#E8D4A8" />
    {/* Thread wound on spool */}
    <ellipse cx="68" cy="168" rx="20" ry="8" fill="#C9A96E" opacity="0.95" />
    <ellipse cx="68" cy="168" rx="10" ry="4" fill="rgba(45,27,37,0.25)" />
    {/* Spool center highlight */}
    <ellipse cx="68" cy="168" rx="6" ry="2.4" fill="rgba(255,255,255,0.15)" />

    {/* ── Thread line from spool ─────────────────────────── */}
    <path
      d="M84 156 C100 138 118 122 138 108 C156 95 172 84 188 70"
      stroke="#E8D4A8"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="5 4"
      opacity="0.7"
    />

    {/* ── Large Needle ──────────────────────────────────── */}
    {/* Needle body */}
    <path
      d="M178 78 L210 46"
      stroke="#E8D4A8"
      strokeWidth="6"
      strokeLinecap="round"
    />
    {/* Needle sheen highlight */}
    <path
      d="M180 76 L209 48"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Needle eye */}
    <ellipse
      cx="181"
      cy="76"
      rx="5.5"
      ry="3.2"
      transform="rotate(-45 181 76)"
      fill="#2D1B25"
      stroke="#C9A96E"
      strokeWidth="1.8"
    />
    {/* Needle tip glint */}
    <path
      d="M208 48 L214 42"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* ── Second decorative small needle ────────────────── */}
    <path
      d="M110 185 L128 167"
      stroke="#C9A96E"
      strokeWidth="3.5"
      strokeLinecap="round"
      opacity="0.55"
    />
    <ellipse
      cx="112"
      cy="183"
      rx="3"
      ry="1.8"
      transform="rotate(-45 112 183)"
      fill="#2D1B25"
      stroke="#C9A96E"
      strokeWidth="1.2"
      opacity="0.6"
    />

    {/* ── Second thread loop ────────────────────────────── */}
    <path
      d="M105 200 Q130 178 152 162 Q168 150 178 140"
      stroke="#C9A96E"
      strokeWidth="1.2"
      fill="none"
      strokeDasharray="3 4"
      opacity="0.4"
    />

    {/* ── Decorative dots (beads / pins) ────────────────── */}
    <circle cx="130" cy="90"  r="3.5" fill="#C9A96E" opacity="0.55" />
    <circle cx="155" cy="104" r="2.5" fill="#E8D4A8" opacity="0.5"  />
    <circle cx="108" cy="118" r="2"   fill="#C9A96E" opacity="0.45" />
    <circle cx="172" cy="126" r="2"   fill="#E8D4A8" opacity="0.35" />
    <circle cx="88"  cy="138" r="2.5" fill="#C9A96E" opacity="0.4"  />
    <circle cx="145" cy="145" r="1.8" fill="#E8D4A8" opacity="0.4"  />
    <circle cx="196" cy="98"  r="2"   fill="#C9A96E" opacity="0.3"  />

    {/* ── Scissors (top-left, decorative) ──────────────── */}
    {/* Blade 1 */}
    <path
      d="M28 46 L52 30"
      stroke="#C9A96E"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* Blade 2 */}
    <path
      d="M28 36 L52 52"
      stroke="#C9A96E"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* Pivot */}
    <circle cx="38" cy="41" r="3.5" fill="#C9A96E" opacity="0.5" />
    {/* Handle rings */}
    <circle cx="20" cy="50" r="7" fill="none" stroke="#C9A96E" strokeWidth="1.5" opacity="0.4" />
    <circle cx="20" cy="32" r="7" fill="none" stroke="#C9A96E" strokeWidth="1.5" opacity="0.4" />

    {/* ── Running stitch lines at bottom ────────────────── */}
    <path
      d="M22 228 L238 228"
      stroke="#E8D4A8"
      strokeWidth="1.2"
      strokeDasharray="8 5"
      opacity="0.25"
    />
    <path
      d="M22 238 L238 238"
      stroke="#E8D4A8"
      strokeWidth="1.2"
      strokeDasharray="8 5"
      opacity="0.15"
    />
  </svg>
);

/* ── Small needle icon for the form panel ─────────────────── */
const NeedleIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 19 L17 5" stroke="#E8D4A8" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse
      cx="16.5"
      cy="5.5"
      rx="2.2"
      ry="1.3"
      transform="rotate(-45 16.5 5.5)"
      fill="none"
      stroke="#C9A96E"
      strokeWidth="1.4"
    />
    <path
      d="M16 6.5 Q12 10 9.5 13 Q7 16 4 20"
      stroke="#C9A96E"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray="2 2"
      fill="none"
      opacity="0.8"
    />
  </svg>
);

/* ── Component ────────────────────────────────────────────── */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { session, user } = useAuth();

  React.useEffect(() => {
    if (session && user) {
      if (user.role === 'PLATFORM_ADMIN') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    }
  }, [session, user, navigate]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      message.success('Welcome back!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left: Branding Panel ─────────────────────────── */}
      <div
        className="login-brand"
        style={{
          flex: '0 0 48%',
          background: 'linear-gradient(160deg, #2D1B25 0%, #5C2238 55%, #8B3A5A 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot-grid background — thread pin-board feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(201,169,110,0.14) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle vignette corners */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 60%, rgba(45,27,37,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* SVG illustration */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <BoutiqueIllustration />
        </div>

        {/* Brand text */}
        <div
          style={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            marginTop: 24,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 46,
              fontWeight: 700,
              color: '#E8D4A8',
              letterSpacing: 6,
              lineHeight: 1,
            }}
          >
            BQOM
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: 64,
              height: 2,
              background:
                'linear-gradient(90deg, transparent, #C9A96E, transparent)',
              margin: '14px auto',
            }}
          />

          <div
            style={{
              color: '#C9A96E',
              fontSize: 14,
              letterSpacing: 2,
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            Boutique Order Management
          </div>

          <div
            style={{
              color: 'rgba(232,212,168,0.55)',
              fontSize: 13,
              fontStyle: 'italic',
              marginTop: 10,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Crafting perfection, one stitch at a time
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAF7F4',
          padding: '48px 40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo mark */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #8B3A5A 0%, #5C2238 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 4px 14px rgba(139,58,90,0.3)',
            }}
          >
            <NeedleIcon />
          </div>

          <Title
            level={2}
            style={{
              marginBottom: 6,
              color: '#2D1B25',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Welcome back
          </Title>
          <Text style={{ color: '#7A6068', fontSize: 14, display: 'block', marginBottom: 36 }}>
            Sign in to your boutique workspace
          </Text>

          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
              style={{ marginBottom: 20 }}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#B0A0A8' }} />}
                placeholder="you@boutique.com"
                autoFocus
                autoComplete="email"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
              style={{ marginBottom: 28 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#B0A0A8' }} />}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 50,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 10,
                  letterSpacing: 0.5,
                  background: 'linear-gradient(135deg, #8B3A5A 0%, #5C2238 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(139,58,90,0.35)',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Running stitch divider */}
          <div
            style={{
              margin: '28px 0 20px',
              height: 1,
              background: 'repeating-linear-gradient(90deg, #C9A96E 0px, #C9A96E 8px, transparent 8px, transparent 16px)',
              opacity: 0.35,
            }}
          />

          <Text style={{ color: '#B0A0A8', fontSize: 12, display: 'block', textAlign: 'center' }}>
            Platform Admin &amp; Tenant Users login here
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Login;
