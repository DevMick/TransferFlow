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
        if (error) throw new Error(error.message ?? 'Sign up failed');
        message.success('Account created — you are now signed in');
      } else {
        const { error } = await signIn.email({
          email: values.email,
          password: values.password,
        });
        if (error) throw new Error(error.message ?? 'Sign in failed');
        message.success('Signed in');
      }
      navigate('/transfers');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (session) {
    return (
      <Card style={{ maxWidth: 420, margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            Signed in as <strong>{session.user.email}</strong>
          </Typography.Text>
          <Button onClick={() => signOut()}>Sign out</Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 420, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Segmented
          block
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { label: 'Sign in', value: 'sign-in' },
            { label: 'Create account', value: 'sign-up' },
          ]}
        />
        <Form layout="vertical" onFinish={onFinish}>
          {mode === 'sign-up' && (
            <Form.Item label="Name" name="name">
              <Input placeholder="Jane Doe" autoComplete="name" />
            </Form.Item>
          )}
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'A valid email is required' }]}
          >
            <Input placeholder="jane@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {mode === 'sign-up' ? 'Create account' : 'Sign in'}
          </Button>
        </Form>
      </Space>
    </Card>
  );
}
