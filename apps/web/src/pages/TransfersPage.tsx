import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTransferSchema, listTransfersQuerySchema } from '@transferflow/shared';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import type { InferResponseType } from 'hono/client';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { baseUrl, client } from '../lib/api';
import { useSession } from '../lib/auth-client';
import { getErrorMessage } from '../lib/errors';
import { translateStatus } from '../lib/status';

interface Establishment {
  nomEtablissement: string;
  logoPath?: string;
}

function FormHeader({
  selectedBank,
  establishments,
}: {
  selectedBank?: string;
  establishments: unknown[];
}) {
  const establishment = selectedBank
    ? (establishments as Establishment[]).find((e) => e.nomEtablissement === selectedBank)
    : null;

  if (!establishment) {
    return 'Nouveau virement';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {establishment.logoPath && (
        <img
          src={establishment.logoPath}
          alt={establishment.nomEtablissement}
          style={{ maxHeight: '32px', maxWidth: '100px', objectFit: 'contain' }}
        />
      )}
      <span>{establishment.nomEtablissement}</span>
    </div>
  );
}

type ListResponse = InferResponseType<typeof client.api.transfers.$get>;
type TransferItem = ListResponse extends { transfers: infer T } ? T : never;
type Transfer = TransferItem extends Array<infer U> ? U : never;

export function TransfersPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [showForm, setShowForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | undefined>(undefined);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingTransfer, setRejectingTransfer] = useState<Transfer | null>(null);
  const [rejectForm] = Form.useForm();

  const isAuthed = Boolean(session);

  const generateTransactionReference = useCallback(() => {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Initialiser le formulaire avec les valeurs par défaut
  useEffect(() => {
    if (showForm) {
      form.setFieldsValue({
        transactionReference: generateTransactionReference(),
        currency: 'EUR',
      });
    } else {
      setSelectedBank(undefined);
    }
  }, [showForm, form, generateTransactionReference]);

  const filters = filterForm.getFieldsValue();

  const transfersQuery = useQuery({
    queryKey: ['transfers', filters],
    enabled: isAuthed,
    queryFn: async () => {
      const query = listTransfersQuerySchema.parse(filters);
      // @ts-expect-error - Client type mismatch
      const res = await client.api.transfers.$get({ query });
      if (!res.ok) throw new Error('Échec du chargement des virements');
      return res.json();
    },
  });

  const establishmentsQuery = useQuery({
    queryKey: ['establishments'],
    queryFn: async () => {
      const res = await client.api.establishments.$get();
      if (!res.ok) throw new Error('Échec du chargement des établissements');
      return res.json();
    },
    enabled: isAuthed,
  });

  const createTransfer = useMutation({
    mutationFn: async (values: unknown) => {
      const input = createTransferSchema.parse(values);
      // Générer automatiquement la date d'exécution et le statut au moment de l'envoi
      const dataToSend = {
        ...input,
        executionDate: new Date().toISOString(),
        status: 'Initié',
      };
      const res = await client.api.transfers.$post({ json: dataToSend });
      if (!res.ok) throw new Error('Échec de la création du virement');
      return res.json();
    },
    onSuccess: () => {
      message.success('Virement créé');
      form.resetFields();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: (err) => message.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const rejectTransfer = useMutation({
    mutationFn: async (values: {
      id: string;
      rejectionFee?: number;
      rejectionFeeCurrency?: string;
      rejectionReason: string;
    }) => {
      const res = await client.api.transfers[':id'].reject.$put({
        param: { id: values.id },
        json: {
          rejectionFee: values.rejectionFee,
          rejectionFeeCurrency: values.rejectionFeeCurrency || 'EUR',
          rejectionReason: values.rejectionReason,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error('error' in data && data.error ? data.error : 'Échec du rejet du virement');
      }
      return data;
    },
    onSuccess: () => {
      message.success('Virement rejeté');
      setRejectModalOpen(false);
      setRejectingTransfer(null);
      rejectForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
    onError: (err) => message.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'transactionReference',
      key: 'transactionReference',
      render: (ref: string | undefined) => ref || '-',
    },
    {
      title: 'Date',
      dataIndex: 'executionDate',
      key: 'executionDate',
      render: (date: string | undefined) =>
        date ? new Date(date).toLocaleDateString('fr-BE') : '-',
    },
    {
      title: 'Bénéficiaire',
      dataIndex: 'beneficiaryName',
      key: 'beneficiaryName',
      render: (name: string | undefined) => name || '-',
    },
    {
      title: 'IBAN / BE',
      dataIndex: 'iban',
      key: 'iban',
      responsive: ['lg'] as Breakpoint[],
      render: (iban: string | undefined) =>
        iban ? `${iban.slice(0, 4)}...${iban.slice(-4)}` : '-',
    },
    {
      title: 'Montant',
      key: 'amount',
      render: (_: unknown, row: Transfer) => `${Number(row.amount).toFixed(2)} ${row.currency}`,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'rejected' ? 'red' : 'blue'}>{translateStatus(status)}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: Transfer) => (
        <Space size="small">
          <Link to={`/transfers/${row.id}`}>
            <Button size="small" icon={<EyeOutlined />} title="Voir les détails" />
          </Link>
          <Button
            size="small"
            onClick={() => {
              window.open(`${baseUrl}/api/transfers/${row.id}/pdf/initiation`, '_blank');
            }}
          >
            PDF
          </Button>
          {row.status === 'Initié' && (
            <Button
              size="small"
              danger
              onClick={() => {
                setRejectingTransfer(row);
                setRejectModalOpen(true);
                rejectForm.setFieldsValue({
                  id: row.id,
                  rejectionFeeCurrency: row.currency || 'EUR',
                });
              }}
              loading={rejectTransfer.isPending}
            >
              Rejeter
            </Button>
          )}
          {row.status === 'rejected' && (
            <Button
              size="small"
              onClick={() => {
                window.open(`${baseUrl}/api/transfers/${row.id}/pdf/rejection`, '_blank');
              }}
            >
              PDF rejet
            </Button>
          )}
        </Space>
      ),
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
            Vous devez <Link to="/login">vous connecter</Link> pour voir et créer des virements.
          </span>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Filtres" size="small">
        <Form form={filterForm} layout="inline" className="tf-filter-form">
          <Form.Item name="search">
            <Input.Search
              placeholder="Rechercher..."
              allowClear
              style={{ width: '100%' }}
              onSearch={() => queryClient.invalidateQueries({ queryKey: ['transfers'] })}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="Statut"
              allowClear
              style={{ width: '100%' }}
              onChange={() => queryClient.invalidateQueries({ queryKey: ['transfers'] })}
              options={[
                { label: 'Initié', value: 'initiated' },
                { label: 'Rejeté', value: 'rejected' },
              ]}
            />
          </Form.Item>
          <Form.Item name="period">
            <Select
              placeholder="Période"
              allowClear
              style={{ width: '100%' }}
              onChange={() => queryClient.invalidateQueries({ queryKey: ['transfers'] })}
              options={[
                { label: '7 jours', value: '7d' },
                { label: '30 jours', value: '30d' },
                { label: '90 jours', value: '90d' },
                { label: '1 an', value: '1y' },
              ]}
            />
          </Form.Item>
        </Form>
      </Card>

      {showForm && (
        <Card
          title={
            <FormHeader
              selectedBank={selectedBank}
              establishments={establishmentsQuery.data?.establishments || []}
            />
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createTransfer.mutate(values)}
            initialValues={{ currency: 'EUR' }}
          >
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              DÉTAILS DE LA TRANSACTION
            </Typography.Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Établissement émetteur" name="senderBank">
                  <Select
                    placeholder="Sélectionnez un établissement..."
                    loading={establishmentsQuery.isLoading}
                    onChange={(value: string) => {
                      setSelectedBank(value);
                      form.validateFields(['senderBank']);
                    }}
                    options={
                      establishmentsQuery.data?.establishments?.map(
                        (e: Record<string, unknown>) => ({
                          label: e.nomEtablissement,
                          value: e.nomEtablissement,
                        }),
                      ) || []
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Référence de la transaction" name="transactionReference">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5}>INFORMATIONS DES PARTIES DONNEUR D'ORDRE</Typography.Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Nom de compte" name="senderAccountName">
                  <Input placeholder="Snelle Vanerie" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="N° compte" name="senderAccountNumber">
                  <Input placeholder="BE13567866625242" />
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5}>BÉNÉFICIAIRE</Typography.Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Nom du bénéficiaire" name="beneficiaryName">
                  <Input placeholder="MISER PETER" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="IBAN / BE" name="iban">
                  <Input placeholder="BE92437217453123" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="E-mail" name="beneficiaryEmail">
                  <Input placeholder="Petermiseur@gmail.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Code BIC/SWIFT" name="bicSwift">
                  <Input placeholder="KREDBEBB" />
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5}>MONTANT DU VIREMENT</Typography.Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Montant" name="amount">
                  <InputNumber style={{ width: '100%' }} placeholder="5 000,00" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Devise" name="currency">
                  <Input placeholder="EUR" />
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
              <Button type="primary" htmlType="submit" loading={createTransfer.isPending}>
                Envoyer le virement
              </Button>
              <Button onClick={() => setShowForm(false)}>Annuler</Button>
            </Space>
          </Form>
        </Card>
      )}

      <Modal
        title="Rejet du virement"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectingTransfer(null);
          rejectForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {rejectingTransfer && (
          <>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Informations du virement à rejeter
            </Typography.Title>
            <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
              <div>
                <strong>Bénéficiaire :</strong> {rejectingTransfer.beneficiaryName || '-'}
              </div>
              <div>
                <strong>Email :</strong> {rejectingTransfer.beneficiaryEmail || '-'}
              </div>
              <div>
                <strong>IBAN :</strong> {rejectingTransfer.iban || '-'}
              </div>
              <div>
                <strong>Montant :</strong>{' '}
                {rejectingTransfer.amount
                  ? `${Number(rejectingTransfer.amount).toFixed(2)} ${rejectingTransfer.currency}`
                  : '-'}
              </div>
              <div>
                <strong>Banque :</strong> {rejectingTransfer.senderBank || '-'}
              </div>
              <div>
                <strong>Date d'initiation :</strong>{' '}
                {rejectingTransfer.executionDate
                  ? new Date(rejectingTransfer.executionDate).toLocaleDateString('fr-BE')
                  : '-'}
              </div>
            </Space>

            <Typography.Title level={5}>Formulaire de rejet</Typography.Title>
            <Form
              form={rejectForm}
              layout="vertical"
              onFinish={(values) => {
                const submitValues = {
                  ...values,
                  id: rejectingTransfer?.id,
                };
                console.log('Submitting reject with values:', submitValues);
                rejectTransfer.mutate(submitValues);
              }}
            >
              <Form.Item name="id" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                label="Frais de redirection"
                name="rejectionFee"
                extra="Montant des frais en décimales (ex: 25.50) - Aucune limite de montant"
              >
                <InputNumber style={{ width: '100%' }} placeholder="0.00" min={0} step={0.01} />
              </Form.Item>

              <Form.Item
                label="Devise des frais"
                name="rejectionFeeCurrency"
                initialValue="EUR"
                extra="Les frais seront dans la même devise que le virement"
              >
                <Input disabled />
              </Form.Item>

              <Form.Item
                label="Motif du rejet"
                name="rejectionReason"
                rules={[{ required: true, message: 'Le motif du rejet est requis' }]}
                extra="Expliquez clairement la raison du rejet"
              >
                <Input.TextArea rows={4} placeholder="Expliquez la raison du rejet..." />
              </Form.Item>

              <Alert
                message="Attention"
                description="Cette action est irréversible. Le bénéficiaire recevra un email de notification du rejet avec les frais de redirection."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    loading={rejectTransfer.isPending}
                  >
                    Confirmer le rejet
                  </Button>
                  <Button onClick={() => setRejectModalOpen(false)}>Annuler</Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Card
        title="Vos virements"
        extra={
          !showForm && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>
              Nouveau virement
            </Button>
          )
        }
      >
        <div className="tf-table-scroll">
          <Table<Transfer>
            rowKey="id"
            columns={columns}
            loading={transfersQuery.isLoading}
            dataSource={transfersQuery.data?.transfers ?? []}
            locale={{ emptyText: 'Aucun virement — créez-en votre premier.' }}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 520 }}
          />
        </div>
      </Card>
    </Space>
  );
}
