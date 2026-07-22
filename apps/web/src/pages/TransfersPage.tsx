import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTransferSchema } from '@transferflow/shared';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
} from 'antd';
import type { InferResponseType } from 'hono/client';
import { Link } from 'react-router';
import { client } from '../lib/api';
import { useSession } from '../lib/auth-client';

type ListResponse = InferResponseType<typeof client.api.transfers.$get>;
type TransferItem = ListResponse extends { transfers: infer T } ? T : never;
type Transfer = TransferItem extends Array<infer U> ? U : never;

const statusColor: Record<string, string> = {
  pending: 'gold',
  processing: 'blue',
  completed: 'green',
  failed: 'red',
  cancelled: 'default',
};

const columns = [
  { title: 'Recipient', dataIndex: 'recipientName', key: 'recipientName' },
  { title: 'IBAN', dataIndex: 'recipientIban', key: 'recipientIban' },
  {
    title: 'Amount',
    key: 'amount',
    render: (_: unknown, row: Transfer) => `${Number(row.amount).toFixed(2)} ${row.currency}`,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => <Tag color={statusColor[status] ?? 'default'}>{status}</Tag>,
  },
];

export function TransfersPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const isAuthed = Boolean(session);

  const transfersQuery = useQuery({
    queryKey: ['transfers'],
    enabled: isAuthed,
    queryFn: async () => {
      const res = await client.api.transfers.$get({ query: {} });
      if (!res.ok) throw new Error('Failed to load transfers');
      return res.json();
    },
  });

  const createTransfer = useMutation({
    mutationFn: async (values: unknown) => {
      const input = createTransferSchema.parse(values);
      const res = await client.api.transfers.$post({ json: input });
      if (!res.ok) throw new Error('Failed to create transfer');
      return res.json();
    },
    onSuccess: () => {
      message.success('Transfer created');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Something went wrong'),
  });

  if (!sessionLoading && !isAuthed) {
    return (
      <Alert
        type="info"
        showIcon
        message="Sign in required"
        description={
          <span>
            You need to <Link to="/login">sign in</Link> to view and create transfers.
          </span>
        }
      />
    );
  }

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={14}>
        <Card title="Your transfers">
          <Table<Transfer>
            rowKey="id"
            columns={columns}
            loading={transfersQuery.isLoading}
            dataSource={transfersQuery.data?.transfers ?? []}
            locale={{ emptyText: 'No transfers yet — create your first one.' }}
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="New transfer">
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createTransfer.mutate(values)}
            initialValues={{ currency: 'EUR' }}
          >
            <Form.Item
              label="Recipient name"
              name="recipientName"
              rules={[{ required: true, message: 'Recipient name is required' }]}
            >
              <Input placeholder="Jane Doe" />
            </Form.Item>
            <Form.Item
              label="IBAN"
              name="recipientIban"
              rules={[{ required: true, message: 'IBAN is required' }]}
            >
              <Input placeholder="FR76 3000 6000 0112 3456 7890 189" />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }}>
              <Form.Item
                label="Amount"
                name="amount"
                rules={[{ required: true, message: 'Amount is required' }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={0.01} style={{ width: '100%' }} placeholder="100.00" />
              </Form.Item>
              <Form.Item label="Currency" name="currency" style={{ width: 100 }}>
                <Input maxLength={3} />
              </Form.Item>
            </Space>
            <Form.Item label="Reference" name="reference">
              <Input.TextArea rows={2} placeholder="Invoice #1234" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={createTransfer.isPending}>
              Send transfer
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
