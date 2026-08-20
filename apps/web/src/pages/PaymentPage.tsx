import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePaymentInput } from '@transferflow/shared';
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
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import type { InferResponseType } from 'hono/client';
import { useState } from 'react';
import { Link } from 'react-router';
import { client } from '../lib/api';
import { useSession } from '../lib/auth-client';
import { getErrorMessage } from '../lib/errors';

type ListResponse = InferResponseType<typeof client.api.payments.$get>;
type PaymentItem = ListResponse extends { payments: infer T } ? T : never;
type Payment = PaymentItem extends Array<infer U> ? U : never;

export function PaymentPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [showForm, setShowForm] = useState(false);

  const isAuthed = Boolean(session);

  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    enabled: isAuthed,
    queryFn: async () => {
      const res = await client.api.payments.$get();
      if (!res.ok) throw new Error('Échec du chargement des paiements');
      return res.json();
    },
  });

  const createPayment = useMutation({
    mutationFn: async (values: CreatePaymentInput) => {
      const res = await client.api.payments.$post({ json: values });
      if (!res.ok) throw new Error('Échec de la création du paiement');
      return res.json();
    },
    onSuccess: () => {
      message.success('Paiement créé et email envoyé');
      form.resetFields();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (err) => message.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const columns = [
    {
      title: 'Destinataire',
      dataIndex: 'recipient',
      key: 'recipient',
      render: (name: string | undefined) => name || '-',
    },
    {
      title: 'Payeur',
      dataIndex: 'payerName',
      key: 'payerName',
      render: (name: string | undefined) => name || '-',
    },
    {
      title: 'Bénéficiaire',
      dataIndex: 'beneficiaryName',
      key: 'beneficiaryName',
      render: (name: string | undefined) => name || '-',
    },
    {
      title: 'Montant',
      key: 'amount',
      render: (_: unknown, row: Payment) => `${Number(row.amount).toFixed(2)} €`,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['lg'] as Breakpoint[],
      render: (date: string | undefined) =>
        date ? new Date(date).toLocaleDateString('fr-BE') : '-',
    },
  ];

  if (!sessionLoading && !isAuthed) {
    return (
      <Alert
        type="info"
        showIcon
        message="Connexion requise"
        description={
          <span>
            Vous devez <Link to="/login">vous connecter</Link> pour gérer les paiements.
          </span>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {showForm && (
        <Card title="Nouveau paiement">
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createPayment.mutate(values)}
          >
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              INFORMATIONS DU PAIEMENT
            </Typography.Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Destinataire(s)"
                  name="recipient"
                  rules={[{ required: true, message: 'Le destinataire est requis' }]}
                >
                  <Input placeholder="nom@exemple.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Transfert de (Nom du payeur)"
                  name="payerName"
                  rules={[{ required: true, message: 'Le nom du payeur est requis' }]}
                >
                  <Input placeholder="Chloe Michel" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Bénéficiaire"
                  name="beneficiaryName"
                  rules={[{ required: true, message: 'Le bénéficiaire est requis' }]}
                >
                  <Input placeholder="Jason Sacchettino" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Montant du virement €"
                  name="amount"
                  rules={[{ required: true, message: 'Le montant est requis' }]}
                >
                  <InputNumber style={{ width: '100%' }} placeholder="72,10" min={0} step={0.01} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Numéro de compte IBAN"
                  name="iban"
                  rules={[{ required: true, message: "L'IBAN est requis" }]}
                >
                  <Input placeholder="BE69XXXXXXXXXX9078" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Nom de l'entreprise"
                  name="companyName"
                  rules={[{ required: true, message: "Le nom de l'entreprise est requis" }]}
                >
                  <Input placeholder="Vinted Pro" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Objet"
                  name="subject"
                  initialValue="Notification de paiement en attente"
                  rules={[{ required: true, message: "L'objet est requis" }]}
                >
                  <Input.TextArea
                    rows={2}
                    placeholder="Notification de paiement en attente"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Nom de l'expéditeur"
                  name="senderName"
                  initialValue="Vinted Pro"
                  rules={[{ required: true, message: "Le nom de l'expéditeur est requis" }]}
                >
                  <Input placeholder="Vinted Pro" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Langue de l'email de notification"
              name="language"
              initialValue="fr"
              rules={[{ required: true, message: 'La langue est requise' }]}
            >
              <Select
                options={[
                  { label: 'Français', value: 'fr' },
                  { label: 'Néerlandais', value: 'nl' },
                ]}
              />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={createPayment.isPending}>
                Envoyer le paiement
              </Button>
              <Button onClick={() => setShowForm(false)}>Annuler</Button>
            </Space>
          </Form>
        </Card>
      )}

      <Card
        title="Vos paiements"
        extra={
          !showForm && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>
              Nouveau paiement
            </Button>
          )
        }
      >
        <div className="tf-table-scroll">
          <Table<Payment>
            rowKey="id"
            columns={columns}
            loading={paymentsQuery.isLoading}
            dataSource={paymentsQuery.data?.payments ?? []}
            locale={{ emptyText: 'Aucun paiement — créez-en votre premier.' }}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 520 }}
          />
        </div>
      </Card>
    </Space>
  );
}
