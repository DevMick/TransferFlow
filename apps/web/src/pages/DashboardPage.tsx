import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  App as AntdApp,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import type { InferResponseType } from 'hono/client';
import { client } from '../lib/api';
import { useSession } from '../lib/auth-client';
import { translateStatus } from '../lib/status';

type DashboardResponse = InferResponseType<typeof client.api.dashboard.$get>;
type StatisticsResponse = InferResponseType<typeof client.api.dashboard.statistics.$get>;

const DISTRIBUTION_COLORS = ['#4f46e5', '#14b8a6', '#f59e0b', '#ec4899', '#06b6d4'];

export function DashboardPage() {
  const { data: session } = useSession();
  const { message } = AntdApp.useApp();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    enabled: !!session,
    queryFn: async () => {
      const res = await client.api.dashboard.$get();
      if (!res.ok) throw new Error('Échec du chargement des données du tableau de bord');
      return res.json();
    },
  });

  const { data: statisticsData, isLoading: statisticsLoading } = useQuery({
    queryKey: ['statistics'],
    enabled: !!session,
    queryFn: async () => {
      const res = await client.api.dashboard.statistics.$get();
      if (!res.ok) throw new Error('Échec du chargement des statistiques');
      return res.json();
    },
  });

  if (!session) {
    return <div>Veuillez vous connecter pour voir le tableau de bord</div>;
  }

  const recentTransfersColumns = [
    {
      title: 'Bénéficiaire',
      dataIndex: 'beneficiaryName',
      key: 'beneficiaryName',
      ellipsis: true,
    },
    {
      title: 'Banque',
      dataIndex: 'bankName',
      key: 'bankName',
      responsive: ['sm'] as Breakpoint[],
      ellipsis: true,
    },
    {
      title: 'Montant',
      key: 'amount',
      width: 160,
      render: (_: unknown, row: any) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {Number(row.amount).toLocaleString('fr-BE', { maximumFractionDigits: 2 })} {row.currency}
        </span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'rejected' ? 'red' : 'blue'}>{translateStatus(status)}</Tag>
      ),
    },
  ];

  const topBeneficiariesColumns = [
    { title: 'Nom', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['sm'] as Breakpoint[],
      ellipsis: true,
    },
    { title: 'Virements', dataIndex: 'count', key: 'count', width: 90 },
    {
      title: 'Montant total',
      key: 'totalAmount',
      width: 140,
      render: (_: unknown, row: any) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {Number(row.totalAmount).toLocaleString('fr-BE', { maximumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const stats = [
    {
      title: 'Total des virements',
      value: dashboardData?.totalTransfers ?? 0,
      icon: <SendOutlined />,
      color: '#4f46e5',
    },
    {
      title: 'Montant total',
      value: Number(dashboardData?.totalAmount ?? 0),
      icon: <WalletOutlined />,
      color: '#14b8a6',
      prefix: '€',
    },
    {
      title: 'Initiés',
      value: dashboardData?.initiatedCount ?? 0,
      icon: <CheckCircleOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Rejetés',
      value: dashboardData?.rejectedCount ?? 0,
      icon: <CloseCircleOutlined />,
      color: '#cf1322',
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={12} md={6} key={s.title}>
            <Card
              loading={dashboardLoading}
              className="tf-stat-card"
              style={{ borderTop: `3px solid ${s.color}` }}
            >
              <div className="tf-stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
                {s.icon}
              </div>
              <Tooltip
                title={
                  s.prefix
                    ? `${s.prefix}${s.value.toLocaleString('fr-BE', { maximumFractionDigits: 2 })}`
                    : s.value.toLocaleString('fr-BE')
                }
              >
                <div className="tf-stat-value" style={{ color: s.color }}>
                  <Statistic
                    title={s.title}
                    value={s.value}
                    prefix={s.prefix}
                    precision={s.prefix ? 2 : 0}
                    valueStyle={{ color: s.color, fontSize: 'clamp(16px, 2.4vw, 22px)' }}
                  />
                </div>
              </Tooltip>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Virements récents" loading={dashboardLoading} className="tf-panel-card">
            <div className="tf-table-scroll">
              <Table
                rowKey="id"
                columns={recentTransfersColumns}
                dataSource={dashboardData?.recentTransfers ?? []}
                pagination={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Principaux bénéficiaires"
            loading={statisticsLoading}
            className="tf-panel-card"
          >
            <div className="tf-table-scroll">
              <Table
                rowKey={(row: any) => `${row.email}-${row.name}`}
                columns={topBeneficiariesColumns}
                dataSource={statisticsData?.topBeneficiaries ?? []}
                pagination={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Distribution par statut"
            loading={statisticsLoading}
            className="tf-panel-card"
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {statisticsData?.statusDistribution.map((item: any) => (
                <div key={item.status} className="tf-distribution-row">
                  <div className="tf-distribution-label">
                    <Tag color={item.status === 'rejected' ? 'red' : 'blue'}>
                      {translateStatus(item.status)}
                    </Tag>
                    <span className="tf-distribution-count">
                      {item.count} · {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    percent={item.percentage}
                    showInfo={false}
                    strokeColor={item.status === 'rejected' ? '#cf1322' : '#1890ff'}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Distribution par banque"
            loading={statisticsLoading}
            className="tf-panel-card"
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {statisticsData?.bankDistribution.slice(0, 5).map((item: any, i: number) => (
                <div key={item.bank} className="tf-distribution-row">
                  <div className="tf-distribution-label">
                    <span className="tf-distribution-name" title={item.bank}>
                      {item.bank}
                    </span>
                    <span className="tf-distribution-count">
                      {item.count} · {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    percent={item.percentage}
                    showInfo={false}
                    strokeColor={DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
