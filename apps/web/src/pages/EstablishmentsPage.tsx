import {
  BankOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';
import { client } from '../lib/api';
import { useSession } from '../lib/auth-client';
import { getErrorMessage } from '../lib/errors';

const { Title } = Typography;

interface Establishment {
  id: string;
  logoPath?: string;
  nomEtablissement: string;
  formeJuridique?: string;
  adresseRue?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  createdAt: string;
  updatedAt: string;
}

export function EstablishmentsPage() {
  const { message: messageApi } = AntdApp.useApp();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const { data: establishmentsData, isLoading } = useQuery({
    queryKey: ['establishments'],
    queryFn: async () => {
      const res = await client.api.establishments.$get();
      if (!res.ok) throw new Error('Échec du chargement des établissements');
      return res.json();
    },
    enabled: !!session,
  });

  const createEstablishment = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const res = await client.api.establishments.$post({ json: values });
      if (!res.ok) throw new Error("Échec de la création de l'établissement");
      return res.json();
    },
    onSuccess: () => {
      messageApi.success('Établissement créé');
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
    onError: (err) => messageApi.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const updateEstablishment = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const res = await client.api.establishments[':id'].$put({
        param: { id },
        json: values,
      });
      if (!res.ok) throw new Error("Échec de la mise à jour de l'établissement");
      return res.json();
    },
    onSuccess: () => {
      messageApi.success('Établissement mis à jour');
      setIsModalOpen(false);
      setEditingId(null);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
    onError: (err) => messageApi.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const deleteEstablishment = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.establishments[':id'].$delete({ param: { id } });
      if (!res.ok) throw new Error("Échec de la suppression de l'établissement");
      return res.json();
    },
    onSuccess: () => {
      messageApi.success('Établissement supprimé');
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
    onError: (err) => messageApi.error(getErrorMessage(err, 'Une erreur est survenue')),
  });

  const handleEdit = (record: Establishment) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    if (record.logoPath) {
      setFileList([
        {
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: record.logoPath,
        },
      ]);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer cet établissement ?',
      onOk: () => deleteEstablishment.mutate(id),
    });
  };

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3000/api/establishments/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (error) {
      messageApi.error("Erreur lors de l'upload de l'image");
      throw error;
    }
  };

  const handleSubmit = async (values: any) => {
    let logoPath = undefined;

    // Upload l'image si un nouveau fichier est sélectionné
    if (fileList.length > 0 && fileList[0].originFileObj) {
      try {
        logoPath = await handleUpload(fileList[0].originFileObj as File);
      } catch (error) {
        return; // L'erreur est déjà gérée dans handleUpload
      }
    } else if (fileList.length > 0 && fileList[0].url) {
      // Utiliser l'URL existante
      logoPath = fileList[0].url;
    }

    const dataToSend = { ...values, logoPath };

    if (editingId) {
      updateEstablishment.mutate({ id: editingId, values: dataToSend });
    } else {
      createEstablishment.mutate(dataToSend);
    }
  };

  const columns = [
    {
      title: 'Logo',
      dataIndex: 'logoPath',
      key: 'logoPath',
      render: (logoPath: string) =>
        logoPath ? (
          <Image src={logoPath} width={40} height={40} style={{ objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BankOutlined />
          </div>
        ),
    },
    {
      title: 'Nom',
      dataIndex: 'nomEtablissement',
      key: 'nomEtablissement',
    },
    {
      title: 'Forme juridique',
      dataIndex: 'formeJuridique',
      key: 'formeJuridique',
    },
    {
      title: 'Adresse',
      key: 'adresse',
      render: (_: unknown, record: Establishment) => {
        const parts = [record.adresseRue, record.codePostal, record.ville, record.pays].filter(
          Boolean,
        );
        return parts.join(', ') || '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Establishment) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Modifier
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  if (!session) {
    return <div>Veuillez vous connecter pour accéder à cette page</div>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="Établissements émetteurs"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvel établissement
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={establishmentsData?.establishments ?? []}
          locale={{ emptyText: 'Aucun établissement — créez-en votre premier.' }}
        />
      </Card>

      <Modal
        title={editingId ? "Modifier l'établissement" : 'Nouvel établissement'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Logo" name="logoPath">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  {fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Uploader</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nom de l'établissement"
                name="nomEtablissement"
                rules={[{ required: true, message: 'Le nom est requis' }]}
              >
                <Input placeholder="KBC Bank NV" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Forme juridique" name="formeJuridique">
                <Input placeholder="Société anonyme" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Pays" name="pays">
                <Input placeholder="Belgique" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Adresse (rue)" name="adresseRue">
                <Input placeholder="Avenue du Port 2" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Code postal" name="codePostal">
                <Input placeholder="1080" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item label="Ville" name="ville">
                <Input placeholder="Bruxelles" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createEstablishment.isPending || updateEstablishment.isPending}
              >
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Annuler</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
