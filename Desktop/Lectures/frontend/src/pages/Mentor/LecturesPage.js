import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Input, Modal, Form, Space, Popconfirm, message, Upload, Typography, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, InboxOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Dragger } = Upload;

function LecturesPage() {
  const { disciplineId: urlDisciplineId } = useParams();
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState(urlDisciplineId || null);
  const [lectures, setLectures] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDisciplines = async () => {
    try {
      const res = await api.getDisciplines();
      console.log('Disciplines loaded:', res.data);
      setDisciplines(res.data);
    } catch (err) {
      console.error('Error loading disciplines:', err);
      message.error('Ошибка загрузки дисциплимн: ' + (err.message || 'неизвестная ошибка'));
    }
  };

  const fetchData = async (discId) => {
    setLoading(true);
    try {
      const res = await api.getLectures(discId);
      console.log('Lectures loaded:', res.data);
      setLectures(res.data);
    } catch (err) {
      console.error('Error loading lectures:', err);
      message.error('Ошибка загрузки лекций');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplines();
  }, []);

  // Sync selected discipline with URL on mount
  useEffect(() => {
    if (urlDisciplineId && !selectedDiscipline) {
      setSelectedDiscipline(urlDisciplineId);
    }
  }, [urlDisciplineId]);

  useEffect(() => {
    if (selectedDiscipline) {
      fetchData(selectedDiscipline);
    } else {
      setLectures([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiscipline]);

  const handleDisciplineChange = (val) => {
    setSelectedDiscipline(val);
    navigate(val ? `/mentor/lectures/${val}` : '/mentor/lectures');
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await api.updateLecture(editingId, values);
        message.success('Лекция обновлена');
      } else {
        const data = { ...values, discipline_id: parseInt(selectedDiscipline) };
        await api.createLecture(data);
        message.success('Лекция создана');
      }
      setModalVisible(false);
      fetchData(selectedDiscipline);
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteLecture(id);
      message.success('Лекция удалена');
      fetchData(selectedDiscipline);
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleDeleteMaterial = async (materialId, lectureId) => {
    try {
      await api.deleteMaterial(materialId);
      message.success('Файл удалён');
      fetchData(selectedDiscipline);
    } catch {
      message.error('Ошибка удаления файла');
    }
  };

  const handleUpload = (lecture) => {
    setCurrentLecture(lecture);
    setUploadModalVisible(true);
  };

  const handleTest = (lecture) => {
    navigate(`/mentor/tests/${lecture.test?.id || lecture.id}`);
  };

  const uploadProps = {
    multiple: true,
    maxCount: 20,
    beforeUpload: () => false,
    onChange: async (info) => {
      // Отправляем только новые файлы (у которых есть originFileObj)
      const newFiles = info.fileList.filter(f => f.originFileObj);
      if (newFiles.length === 0) return;
      
      setUploading(true);
      try {
        await api.uploadMaterials(currentLecture.id, newFiles.map(f => f.originFileObj));
        message.success('Файлы загружены');
        setUploadModalVisible(false);
        fetchData(selectedDiscipline);
      } catch {
        message.error('Ошибка загрузки файлов');
      } finally {
        setUploading(false);
      }
    }
  };

  const columns = [
    { title: '№', dataIndex: 'order_index', key: 'order', width: 60 },
    { title: 'Название', dataIndex: 'title', key: 'title' },
    { title: 'Описание', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Материалы',
      key: 'materials',
      render: (_, record) => {
        const materials = record.materials || [];
        if (materials.length === 0) return <span style={{ color: '#999' }}>—</span>;
        return (
          <Space direction="vertical" size="small" style={{ maxWidth: 400 }}>
            {materials.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>📎</span>
                <span 
                  style={{ flex: 1, wordBreak: 'break-word', color: '#1890ff', cursor: 'pointer' }}
                  title={m.file_name}
                  onClick={() => window.open(`/${m.file_path}`, '_blank')}
                >
                  {m.file_name}
                </span>
                <Button 
                  type="text" 
                  size="small" 
                  danger 
                  icon={<DeleteOutlined />} 
                  title="Удалить файл"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMaterial(m.id, record.id);
                  }}
                  style={{ zIndex: 10, flexShrink: 0 }}
                />
              </div>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Тест',
      key: 'test',
      render: (_, record) => record.test ? '✓' : '—'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<InboxOutlined />} size="small" onClick={() => handleUpload(record)}>
            Загрузить
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Удалить лекцию?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={4}>Лекции</Title>
      
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>Дисциплина: </Typography.Text>
        <Select
          placeholder="Выберите дисциплину"
          value={selectedDiscipline}
          onChange={handleDisciplineChange}
          style={{ width: 300 }}
          options={disciplines.map(d => ({ value: d.id, label: d.name }))}
          allowClear
        />
        {disciplines.length === 0 && (
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
            (сначала создайте дисциплину в разделе "Дисциплины")
          </Typography.Text>
        )}
      </div>

      {!selectedDiscipline ? (
        <Typography.Text type="secondary">
          Выберите дисциплину для управления лекциями
        </Typography.Text>
      ) : (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
            Добавить лекцию
          </Button>
          <Table 
            columns={columns} 
            dataSource={lectures} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 20 }} 
          />
        </>
      )}

      <Modal
        title={editingId ? 'Редактировать лекцию' : 'Добавить лекцию'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Загрузка файлов"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Dragger {...uploadProps} accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.jpg,.png,.gif,.mp4,.avi" style={{ marginTop: 16 }}>
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>Нажмите или перетащите файлы сюда</p>
          <p style={{ color: '#999', fontSize: 12 }}>PDF, DOC, PPT, ZIP, JPG, PNG, MP4 (макс. 500 МБ)</p>
        </Dragger>
      </Modal>
    </div>
  );
}

export default LecturesPage;
