import { SendOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { signIn, signOut, useSession } from '../lib/auth-client';

interface FormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const { message } = AntdApp.useApp();
  const { data: session } = useSession();
  const navigate = useNavigate();

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    try {
      const { error } = await signIn.email({
        email: values.email,
        password: values.password,
      });
      if (error) throw new Error(error.message ?? 'Connexion échouée');
      message.success('Connecté');
      navigate('/transfers');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Authentification échouée');
    } finally {
      setSubmitting(false);
    }
  }

  if (session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8vh' }}>
        <Card style={{ width: '100%', maxWidth: 420 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text>
              Connecté en tant que <strong>{session.user.email}</strong>
            </Typography.Text>
            <Button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
            >
              Se déconnecter
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 'clamp(16px, 6vh, 64px)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <div
              className="tf-stat-icon"
              style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5', fontSize: 22 }}
            >
              <SendOutlined />
            </div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Bienvenue sur TransferFlow
            </Typography.Title>
            <Typography.Text type="secondary">
              Connectez-vous pour gérer vos virements
            </Typography.Text>
          </Space>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Un email valide est requis' }]}
            >
              <Input placeholder="jean@example.com" autoComplete="email" />
            </Form.Item>
            <Form.Item
              label="Mot de passe"
              name="password"
              rules={[{ required: true, min: 8, message: 'Au moins 8 caractères' }]}
            >
              <Input.Password placeholder="••••••••" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Se connecter
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
