import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Space, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

function DisciplinesPage() {
  const [disciplines, setDisciplines] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkDisciplineId, setLinkDisciplineId] = useState(null);

  const fetchDisciplines = async () => {
    try {
      const res = await api.getDisciplines();
      setDisciplines(res.data);
    } catch (err) {
      message.error('Ошибка загрузки дисциплин');
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.data);
    } catch (err) {
      message.error('Ошибка загрузки групп');
    }
  };

  useEffect(() => {
    fetchDisciplines();
    fetchGroups();
  }, []);

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
        await api.updateDiscipline(editingId, values.name);
        message.success('Дисциплина обновлена');
      } else {
        await api.createDiscipline(values.name);
        message.success('Дисциплина создана');
      }
      setModalVisible(false);
      fetchDisciplines();
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDiscipline(id);
      message.success('Дисциплина удалена');
      fetchDisciplines();
    } catch (err) {
      message.error('Ошибка удаления');
    }
  };

  const handleLink = (id) => {
    setLinkDisciplineId(id);
    setLinkModalVisible(true);
  };

  const handleUnlink = async (groupId) => {
    try {
      await api.unlinkDisciplineFromGroup(linkDisciplineId, groupId);
      message.success('Группа отвязана');
      fetchDisciplines();
    } catch (err) {
      message.error('Ошибка отвязки');
    }
  };

  const handleLinkGroup = async (groupId) => {
    try {
      await api.linkDisciplineToGroup(linkDisciplineId, groupId);
      message.success('Группа привязана');
      setLinkModalVisible(false);
      fetchDisciplines();
    } catch (err) {
      message.error('Ошибка привязки');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    {
      title: 'Группы',
      key: 'groups',
      render: (_, record) => {
        const linked = record.groups || [];
        return (
          <Space size="small">
            {linked.length > 0 ? linked.map(g => (
              <span key={g.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {g.name}
                <Popconfirm title="Отвязать группу?" onConfirm={() => handleUnlink(g.id)}>
                  <CloseOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                </Popconfirm>
              </span>
            )) : <span style={{ color: '#999' }}>Нет групп</span>}
          </Space>
        );
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button icon={<LinkOutlined />} size="small" onClick={() => handleLink(record.id)} />
          <Popconfirm title="Удалить дисциплину?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={4}>Дисциплины</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Добавить дисциплину
      </Button>
      <Table
        columns={columns}
        dataSource={disciplines}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingId ? 'Редактировать дисциплину' : 'Добавить дисциплину'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Управление группами"
        open={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>Привязать группу</Title>
          {groups.map(g => (
            <div key={g.id} style={{ marginBottom: 8 }}>
              <Button size="small" onClick={() => handleLinkGroup(g.id)}>
                + {g.name}
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default DisciplinesPage;
