import {
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  PictureOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router';
import { client } from '../lib/api';
import { signOut, useSession } from '../lib/auth-client';
import { getErrorMessage } from '../lib/errors';

export function ProfilePage() {
  const { message } = AntdApp.useApp();
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await client.api.users.me.$get();
      if (!res.ok) throw new Error('Échec du chargement des données utilisateur');
      return res.json();
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (values: { name?: string; image?: string }) => {
      const res = await client.api.users.me.$put({ json: values });
      if (!res.ok) throw new Error('Échec de la mise à jour du profil');
      return res.json();
    },
    onSuccess: () => {
      message.success('Profil mis à jour');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const changePassword = useMutation({
    mutationFn: async (values: { currentPassword: string; newPassword: string }) => {
      const res = await client.api.users.me.password.$put({ json: values });
      if (!res.ok) throw new Error('Échec du changement de mot de passe');
      return res.json();
    },
    onSuccess: () => {
      message.success('Mot de passe modifié');
      form.resetFields();
    },
    onError: (err) => message.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  if (!session) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const user = userData?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}
    >
      <Card className="tf-panel-card tf-profile-hero">
        <Space align="center" size={16}>
          <Avatar size={72} src={user?.image || undefined} className="tf-profile-avatar">
            {!user?.image && initials}
          </Avatar>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {user?.name || 'Utilisateur'}
            </Typography.Title>
            <Typography.Text type="secondary">{user?.email}</Typography.Text>
          </div>
        </Space>
      </Card>

      <Card title="Informations du profil" className="tf-panel-card">
        <Form
          layout="vertical"
          initialValues={userData?.user}
          onFinish={(values) => updateProfile.mutate(values)}
        >
          <Form.Item label="Nom" name="name">
            <Input prefix={<UserOutlined style={{ color: 'var(--tf-muted, #8c8c8c)' }} />} />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input
              disabled
              prefix={<MailOutlined style={{ color: 'var(--tf-muted, #8c8c8c)' }} />}
            />
          </Form.Item>
          <Form.Item label="URL de l'image" name="image">
            <Input
              placeholder="https://example.com/avatar.jpg"
              prefix={<PictureOutlined style={{ color: 'var(--tf-muted, #8c8c8c)' }} />}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateProfile.isPending}>
            Mettre à jour le profil
          </Button>
        </Form>
      </Card>

      <Card title="Changer le mot de passe" className="tf-panel-card">
        <Form form={form} layout="vertical" onFinish={(values) => changePassword.mutate(values)}>
          <Form.Item
            label="Mot de passe actuel"
            name="currentPassword"
            rules={[{ required: true, message: 'Le mot de passe actuel est requis' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--tf-muted, #8c8c8c)' }} />}
            />
          </Form.Item>
          <Form.Item
            label="Nouveau mot de passe"
            name="newPassword"
            rules={[{ required: true, min: 8, message: 'Au moins 8 caractères' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--tf-muted, #8c8c8c)' }} />}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
            Changer le mot de passe
          </Button>
        </Form>
      </Card>

      <Card className="tf-panel-card tf-danger-card">
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Typography.Text strong>Se déconnecter</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Vous serez redirigé vers la page de connexion.
          </Typography.Text>
        </Space>
        <Divider style={{ margin: '12px 0' }} />
        <Button danger icon={<LogoutOutlined />} onClick={() => signOut()}>
          Se déconnecter
        </Button>
      </Card>
    </Space>
  );
}
