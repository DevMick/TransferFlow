import { SendOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Card, Form, Input, Segmented, Space, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { signIn, signOut, signUp, useSession } from '../lib/auth-client';

type Mode = 'sign-in' | 'sign-up';

interface FormValues {
  name?: string;
  email: string;
  password: string;
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [submitting, setSubmitting] = useState(false);
  const { message } = AntdApp.useApp();
  const { data: session } = useSession();
  const navigate = useNavigate();

  async function onFinish(values: FormValues) {
    setSubmitting(true);
    try {
      if (mode === 'sign-up') {
        const { error } = await signUp.email({
          name: values.name ?? values.email,
          email: values.email,
          password: values.password,
        });
        if (error) throw new Error(error.message ?? 'Inscription échouée');
        message.success('Compte créé — vous êtes maintenant connecté');
      } else {
        const { error } = await signIn.email({
          email: values.email,
          password: values.password,
        });
        if (error) throw new Error(error.message ?? 'Connexion échouée');
        message.success('Connecté');
      }
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
            <Button onClick={() => signOut()}>Se déconnecter</Button>
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
            <Typography.Text type="secondary">Connectez-vous pour gérer vos virements</Typography.Text>
          </Space>

          <Segmented
            block
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { label: 'Connexion', value: 'sign-in' },
              { label: 'Créer un compte', value: 'sign-up' },
            ]}
          />
          <Form layout="vertical" onFinish={onFinish}>
            {mode === 'sign-up' && (
              <Form.Item label="Nom" name="name">
                <Input placeholder="Jean Dupont" autoComplete="name" />
              </Form.Item>
            )}
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
              <Input.Password
                placeholder="••••••••"
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              {mode === 'sign-up' ? 'Créer un compte' : 'Se connecter'}
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
