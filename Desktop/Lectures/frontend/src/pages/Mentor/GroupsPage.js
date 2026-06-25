import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Space, Popconfirm, message, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.data);
    } catch {
      message.error('Ошибка загрузки групп');
    }
  };

  useEffect(() => { fetchGroups(); }, []);

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
        await api.updateGroup(editingId, values.name);
        message.success('Группа обновлена');
      } else {
        await api.createGroup(values.name);
        message.success('Группа создана');
      }
      setModalVisible(false);
      fetchGroups();
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteGroup(id);
      message.success('Группа удалена');
      fetchGroups();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Удалить группу?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="groups-page">
      <h2>Группы</h2>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }} block={isMobile}>
        Добавить группу
      </Button>
      
      {/* Десктоп - таблица */}
      {!isMobile && (
        <Table columns={columns} dataSource={groups} rowKey="id" pagination={{ pageSize: 20 }} />
      )}
      
      {/* Мобильные - карточки */}
      {isMobile && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {groups.map(group => (
            <Card key={group.id} size="small" hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>{group.name}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>ID: {group.id}</div>
                </div>
                <Space>
                  <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(group)} />
                  <Popconfirm title="Удалить группу?" onConfirm={() => handleDelete(group.id)}>
                    <Button icon={<DeleteOutlined />} size="small" danger />
                  </Popconfirm>
                </Space>
              </div>
            </Card>
          ))}
        </Space>
      )}

      <Modal
        title={editingId ? 'Редактировать группу' : 'Добавить группу'}
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
    </div>
  );
}

export default GroupsPage;
