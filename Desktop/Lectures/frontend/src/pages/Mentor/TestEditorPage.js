import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Input, Modal, Form, Space, message, DatePicker, Switch, Typography, Card, Popconfirm, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function TestEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const wildcardPath = params["*"] || "";
  const id = wildcardPath ? wildcardPath.split('/')[0] : null;
  
  const [tests, setTests] = useState([]);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qModal, setQModal] = useState(false);
  const [aModal, setAModal] = useState(false);
  const [currentQ, setCurrentQ] = useState(null);
  const [formQ] = Form.useForm();
  const [formA] = Form.useForm();
  const [editingQ, setEditingQ] = useState(null);
  const [editingA, setEditingA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [lectures, setLectures] = useState([]);

  // Load lectures for dropdown
  useEffect(() => {
    api.getDisciplines()
      .then(res => {
        const disciplines = res.data;
        if (disciplines.length === 0) {
          setLectures([]);
          return;
        }
        // Load lectures for each discipline
        Promise.all(disciplines.map(d => api.getLectures(d.id)))
          .then(results => {
            const allLectures = results.flatMap((res, idx) => 
              res.data.map(l => ({
                ...l,
                discipline_name: disciplines[idx].name
              }))
            );
            setLectures(allLectures);
          })
          .catch(err => {
            console.error('Error loading lectures:', err);
            setLectures([]);
          });
      })
      .catch(err => {
        console.error('Error loading disciplines:', err);
        setLectures([]);
      });
  }, []);

  // Load tests list (when no id)
  useEffect(() => {
    if (!id) {
      console.log('Loading tests LIST...');
      api.getTests()
        .then(res => {
          console.log('Tests LIST loaded:', res.data.length, 'items');
          setTests(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading tests:', err);
          message.error('Ошибка загрузки тестов');
          setLoading(false);
        });
    }
  }, [id]);

  // Load test detail - only if id exists and not 'new'
  useEffect(() => {
    if (id && id !== 'new') {
      console.log('Loading test DETAIL:', id);
      api.getTest(id)
        .then(res => {
          console.log('Test DETAIL loaded');
          setTest(res.data);
          setQuestions(res.data.questions || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading test:', err);
          message.error('Ошибка загрузки теста');
          setLoading(false);
        });
    } else if (id === 'new') {
      console.log('Showing NEW test form');
      setLoading(false);
    }
  }, [id]);

  const handleCreateQuestion = () => {
    formQ.resetFields();
    formQ.setFieldsValue({ weight: 1 });
    setEditingQ(null);
    setCurrentQ(null);
    setQModal(true);
  };

  const handleEditQuestion = (q) => {
    formQ.setFieldsValue(q);
    setEditingQ(q.id);
    setCurrentQ(q);
    setQModal(true);
  };

  const handleSaveQuestion = async () => {
    try {
      const values = await formQ.validateFields();
      if (editingQ) {
        await api.updateQuestion(editingQ, values);
        message.success('Вопрос обновлён');
      } else {
        const res = await api.createQuestion(test.id, values);
        setQuestions([...questions, res.data]);
        message.success('Вопрос добавлен');
      }
      setQModal(false);
      if (id) {
        const res = await api.getTest(id);
        setTest(res.data);
        setQuestions(res.data.questions || []);
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    try {
      await api.deleteQuestion(qId);
      message.success('Вопрос удалён');
      if (id) {
        const res = await api.getTest(id);
        setTest(res.data);
        setQuestions(res.data.questions || []);
      }
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleDeleteTest = async (testId) => {
    try {
      await api.deleteTest(testId);
      message.success('Тест удалён');
      navigate('/mentor/tests');
      const res = await api.getTests();
      setTests(res.data);
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleAddAnswer = (q) => {
    formA.resetFields();
    setEditingA(null);
    setCurrentQ(q);
    setAModal(true);
  };

  const handleEditAnswer = (a) => {
    formA.setFieldsValue(a);
    setEditingA(a.id);
    setAModal(true);
  };

  const handleSaveAnswer = async () => {
    try {
      const values = await formA.validateFields();
      if (editingA) {
        await api.updateAnswer(editingA, values);
        message.success('Ответ обновлён');
      } else {
        const res = await api.createAnswer(currentQ.id, values);
        setQuestions(questions.map(q =>
          q.id === currentQ.id
            ? { ...q, answers: [...(q.answers || []), res.data] }
            : q
        ));
        message.success('Ответ добавлен');
      }
      setAModal(false);
      if (id) {
        const res = await api.getTest(id);
        setTest(res.data);
        setQuestions(res.data.questions || []);
      }
    } catch {
      message.error('Ошибка');
    }
  };

  const handleDeleteAnswer = async (qId, aId) => {
    try {
      await api.deleteAnswer(aId);
      message.success('Ответ удалён');
      if (id) {
        const res = await api.getTest(id);
        setTest(res.data);
        setQuestions(res.data.questions || []);
      }
    } catch {
      message.error('Ошибка');
    }
  };

  const handleCreateTest = async () => {
    try {
      const values = await formQ.validateFields();
      const lectureId = values.lecture_id;
      const data = {
        lecture_id: parseInt(lectureId),
        time_limit_minutes: values.time_limit_minutes || 30,
        session_lifetime_minutes: values.session_lifetime_minutes || 10,
        start_datetime: dayjs(values.start_datetime).format('YYYY-MM-DDTHH:mm'),
        attempts_allowed: values.attempts_allowed || 1
      };
      const res = await api.createTest(data);
      message.success('Тест создан');
      navigate(`/mentor/tests/${res.data.id}`);
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка создания теста');
    }
  };

  const questionColumns = [
    { title: 'Текст', dataIndex: 'question_text', key: 'text', ellipsis: true },
    { title: 'Вес', dataIndex: 'weight', key: 'weight', width: 60 },
    {
      title: 'Ответы',
      key: 'answers',
      render: (_, q) => (
        <Space direction="vertical" size="small">
          {(q.answers || []).map(a => (
            <Space key={a.id} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong style={{ color: a.is_correct ? '#52c41a' : 'inherit' }}>
                {a.is_correct ? '✓ ' : ''}{a.answer_text}
              </Text>
              <Space>
                <Button size="small" type="text" onClick={() => handleEditAnswer(a)}>✏️</Button>
                <Popconfirm onConfirm={() => handleDeleteAnswer(q.id, a.id)}>
                  <Button size="small" type="text" danger>🗑️</Button>
                </Popconfirm>
              </Space>
            </Space>
          ))}
        </Space>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, q) => (
        <Space>
          <Button size="small" onClick={() => handleAddAnswer(q)}>+ ответ</Button>
          <Button size="small" onClick={() => handleEditQuestion(q)}>✏️</Button>
          <Popconfirm onConfirm={() => handleDeleteQuestion(q.id)}>
            <Button size="small" danger>🗑️</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Load test detail - only if id exists and not 'new'
  useEffect(() => {
    if (id && id !== 'new') {
      console.log('Loading test DETAIL:', id);
      api.getTest(id)
        .then(res => {
          console.log('Test DETAIL loaded');
          setTest(res.data);
          setQuestions(res.data.questions || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading test:', err);
          message.error('Ошибка загрузки теста');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div style={{ padding: 20 }}>Загрузка...</div>;
  }

  if (!id) {
    return (
      <div className="test-editor-page">
        <Title level={4}>Тесты</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/mentor/tests/new')} style={{ marginBottom: 16 }}>
          Создать тест
        </Button>
        <Table 
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
            { title: 'Лекция ID', dataIndex: 'lecture_id', key: 'lecture_id' },
            { title: 'Время (мин)', dataIndex: 'time_limit_minutes', key: 'time' },
            { title: 'Начало', dataIndex: 'start_datetime', key: 'start' },
            { title: 'Попытки', dataIndex: 'attempts_allowed', key: 'attempts' },
            {
              title: 'Действия',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small" onClick={() => navigate(`/mentor/tests/${record.id}`)}>
                    Редактировать
                  </Button>
                  <Popconfirm title="Удалить?" onConfirm={() => handleDeleteTest(record.id)}>
                    <Button size="small" danger>🗑️</Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
          dataSource={tests}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </div>
    );
  }

  if (id === 'new') {
    return (
      <div className="test-editor-page">
        <Button onClick={() => navigate('/mentor/tests')} style={{ marginBottom: 16 }} icon={<ArrowLeftOutlined />}>← Назад</Button>
        <Title level={4}>Создать тест</Title>
        <Card style={{ maxWidth: 500 }}>
          <Form form={formQ} layout="vertical" onFinish={handleCreateTest}>
            <Form.Item name="lecture_id" label="Лекция" rules={[{ required: true, message: 'Выберите лекцию' }]}>
              <Select placeholder="Выберите лекцию" showSearch optionFilterProp="children">
                {lectures.map(l => (
                  <Select.Option key={l.id} value={l.id}>
                    {l.discipline_name} → {l.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="time_limit_minutes" label="Время выполнения (мин)" initialValue={30}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="session_lifetime_minutes" label="Время сессии (мин)" initialValue={10}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="start_datetime" label="Дата начала" rules={[{ required: true, message: 'Выберите дату' }]}
              initialValue={dayjs()}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="attempts_allowed" label="Попытки" initialValue={1}>
              <Input type="number" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Создать тест</Button>
          </Form>
        </Card>
      </div>
    );
  }

  // Don't render editor if test not loaded yet
  if (id && id !== 'new' && !test) {
    return <div style={{ padding: 20 }}>Загрузка теста...</div>;
  }

  return (
    <div className="test-editor-page">
      <Button onClick={() => navigate('/mentor/tests')} style={{ marginBottom: 16 }} icon={<ArrowLeftOutlined />}>← Назад</Button>
      <Title level={4}>Редактор теста</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical">
          <Text>Время выполнения: {test?.time_limit_minutes || '—'} мин</Text>
          <Text>Время сессии: {test?.session_lifetime_minutes || '—'} мин</Text>
          <Text>Начало: {test?.start_datetime || '—'}</Text>
          <Text>Попытки: {test?.attempts_allowed || '—'}</Text>
        </Space>
      </Card>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateQuestion} style={{ marginBottom: 16 }}>
        Добавить вопрос
      </Button>
      <Table columns={questionColumns} dataSource={questions} rowKey="id" pagination={false} />

      <Modal title={editingQ ? 'Редактировать вопрос' : 'Добавить вопрос'} open={qModal} onCancel={() => setQModal(false)} onOk={handleSaveQuestion}>
        <Form form={formQ} layout="vertical">
          <Form.Item name="question_text" label="Текст вопроса" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="weight" label="Вес" initialValue={1}>
            <Input type="number" step="0.1" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={editingA ? 'Редактировать ответ' : 'Добавить ответ'} open={aModal} onCancel={() => setAModal(false)} onOk={handleSaveAnswer}>
        <Form form={formA} layout="vertical">
          <Form.Item name="answer_text" label="Текст ответа" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_correct" label="Правильный" valuePropName="checked">
            <Switch checkedChildren="Да" unCheckedChildren="Нет" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TestEditorPage;
