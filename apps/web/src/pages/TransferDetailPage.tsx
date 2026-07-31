import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Space, Tag } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { baseUrl, client } from '../lib/api';
import { translateStatus } from '../lib/status';

export function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const transferQuery = useQuery({
    queryKey: ['transfer', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await client.api.transfers[':id'].$get({ param: { id: id! } });
      if (!res.ok) throw new Error('Échec du chargement du virement');
      return res.json();
    },
  });

  const transfer = transferQuery.data?.transfer;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/transfers')}>
        Retour
      </Button>

      {transferQuery.isLoading && <Card loading />}

      {!transferQuery.isLoading && !transfer && (
        <Alert
          type="error"
          showIcon
          message="Virement introuvable"
          description={
            <span>
              Retournez à la <Link to="/transfers">liste des virements</Link>.
            </span>
          }
        />
      )}

      {transfer && (
        <Card title="Détails du virement">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Référence">
              {transfer.transactionReference || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={transfer.status === 'rejected' ? 'red' : 'blue'}>
                {translateStatus(transfer.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date d'exécution">
              {transfer.executionDate
                ? new Date(transfer.executionDate).toLocaleDateString('fr-BE')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Établissement émetteur">
              {transfer.senderBank || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Nom de compte (donneur d'ordre)">
              {transfer.senderAccountName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="N° compte (donneur d'ordre)">
              {transfer.senderAccountNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Nom du bénéficiaire">
              {transfer.beneficiaryName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="IBAN">{transfer.iban || '-'}</Descriptions.Item>
            <Descriptions.Item label="E-mail du bénéficiaire">
              {transfer.beneficiaryEmail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Code BIC/SWIFT">{transfer.bicSwift || '-'}</Descriptions.Item>
            <Descriptions.Item label="Montant">
              {transfer.amount ? `${Number(transfer.amount).toFixed(2)} ${transfer.currency}` : '-'}
            </Descriptions.Item>
            {transfer.status === 'rejected' && (
              <Descriptions.Item label="Motif du rejet">
                {transfer.rejectionReason || '-'}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Space style={{ marginTop: 16 }}>
            <Button
              onClick={() =>
                window.open(`${baseUrl}/api/transfers/${transfer.id}/pdf/initiation`, '_blank')
              }
            >
              PDF
            </Button>
            {transfer.status === 'rejected' && (
              <Button
                onClick={() =>
                  window.open(`${baseUrl}/api/transfers/${transfer.id}/pdf/rejection`, '_blank')
                }
              >
                PDF rejet
              </Button>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
}
