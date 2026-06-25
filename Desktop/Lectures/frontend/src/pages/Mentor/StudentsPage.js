import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Space, Popconfirm, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async (groupId) => {
    setLoading(true);
    try {
      const res = await api.getStudents(groupId);
      setStudents(res.data);
    } catch {
      message.error('Ошибка загрузки студентов');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.data);
    } catch {
      message.error('Ошибка загрузки групп');
    }
  };

  useEffect(() => {
    fetchStudents();
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
      const data = { ...values };
      if (!editingId && !data.password) {
        message.error('Пароль обязателен');
        return;
      }
      if (!data.password) delete data.password;
      
      if (editingId) {
        await api.updateStudent(editingId, data);
        message.success('Студент обновлён');
      } else {
        await api.createStudent(data);
        message.success('Студент добавлен');
      }
      setModalVisible(false);
      fetchStudents();
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteStudent(id);
      message.success('Студент удалён');
      fetchStudents();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const columns = [
    { title: 'Логин', dataIndex: 'login', key: 'login' },
    { title: 'ФИО', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Группа', dataIndex: 'group_name', key: 'group_name' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Удалить студента?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="students-page">
      <h2>Студенты</h2>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Фильтр по группе"
          allowClear
          style={{ width: 200 }}
          onChange={(val) => fetchStudents(val)}
          options={groups.map(g => ({ value: g.id, label: g.name }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить студента
        </Button>
      </Space>
      <Table columns={columns} dataSource={students} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />

      <Modal
        title={editingId ? 'Редактировать студента' : 'Добавить студента'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="login" label="Логин" rules={[{ required: true, message: 'Введите логин' }]}>
            <Input />
          </Form.Item>
          {!editingId && (
            <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="full_name" label="ФИО" rules={[{ required: true, message: 'Введите ФИО' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="group_id" label="Группа">
            <Select>
              {groups.map(g => (
                <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StudentsPage;
