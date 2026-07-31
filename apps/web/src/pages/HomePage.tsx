import {
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { useNavigate } from 'react-router';

const { Title, Paragraph } = Typography;

const features = [
  {
    icon: <ThunderboltOutlined />,
    title: 'API typée',
    body: 'Hono RPC partage les types de bout en bout — pas de génération de code, pas de dérive.',
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Postgres + Drizzle',
    body: 'Schéma entièrement typé, migrations et requêtes sur PostgreSQL 17.',
  },
  {
    icon: <LockOutlined />,
    title: 'Authentification sécurisée',
    body: 'Sessions par email et mot de passe propulsées par Better-Auth.',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div className="tf-hero">
        <div style={{ maxWidth: 640 }}>
          <Title level={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: 8 }}>
            Transférez de l'argent en toute confiance.
          </Title>
          <Paragraph style={{ fontSize: 16, opacity: 0.92, marginBottom: 24 }}>
            TransferFlow est une stack TypeScript moderne : React 19, Ant Design, TanStack Query et
            Zustand côté front-end, Hono, Drizzle et Better-Auth côté back-end.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            ghost
            style={{ borderColor: '#fff', color: '#fff' }}
            onClick={() => navigate('/transfers')}
          >
            Voir les virements <ArrowRightOutlined />
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {features.map((f) => (
          <Col xs={24} sm={12} md={8} key={f.title}>
            <Card>
              <div
                className="tf-stat-icon"
                style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}
              >
                {f.icon}
              </div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {f.title}
              </Typography.Title>
              <Typography.Text type="secondary">{f.body}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
