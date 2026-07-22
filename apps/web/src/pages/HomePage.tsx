import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { useNavigate } from 'react-router';

const { Title, Paragraph } = Typography;

const features = [
  { title: 'Type-safe API', body: 'Hono RPC shares types end-to-end — no codegen, no drift.' },
  {
    title: 'Postgres + Drizzle',
    body: 'Fully typed schema, migrations, and queries on PostgreSQL 17.',
  },
  { title: 'Secure auth', body: 'Email & password sessions powered by Better-Auth.' },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ maxWidth: 720 }}>
        <Title>Move money with confidence.</Title>
        <Paragraph type="secondary" style={{ fontSize: 16 }}>
          TransferFlow is a demo monorepo wiring together a modern TypeScript stack: React 19, Ant
          Design, TanStack Query and Zustand on the front end, Hono, Drizzle and Better-Auth on the
          back end.
        </Paragraph>
        <Button type="primary" size="large" onClick={() => navigate('/transfers')}>
          View transfers <ArrowRightOutlined />
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {features.map((f) => (
          <Col xs={24} md={8} key={f.title}>
            <Card title={f.title}>{f.body}</Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
