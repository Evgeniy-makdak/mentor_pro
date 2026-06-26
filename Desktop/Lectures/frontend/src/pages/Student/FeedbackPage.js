import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Button, message, List, Empty, Tag, Divider, Modal } from 'antd';
import { useAuth } from '../../AuthContext';
import api from '../../api';
import './FeedbackPage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

function StudentFeedbackPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [replyModal, setReplyModal] = useState({ open: false, message: null });
  const [replyForm] = Form.useForm();
  const [replyingTo, setReplyingTo] = useState(null);
  const { user } = useAuth();

  const fetchMessages = async () => {
    try {
      const res = await api.getFeedback();
      // Сортируем: сначала оригинальные сообщения, потом ответы
      const sorted = res.data.sort((a, b) => {
        if (a.parent_id && !b.parent_id) return 1;
        if (!a.parent_id && b.parent_id) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setMessages(sorted);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async (values) => {
    try {
      setLoading(true);
      await api.replyFeedback({
        to_id: replyingTo.from_user_id,
        to_name: replyingTo.from_name,
        to_login: replyingTo.from_login,
        original_feedback_id: replyingTo.id,
        subject: `Re: ${replyingTo.subject || 'Без темы'}`,
        message: values.message
      });
      message.success('Ответ отправлен!');
      setReplyModal({ open: false, message: null });
      setReplyingTo(null);
      replyForm.resetFields();
      setTimeout(() => fetchMessages(), 500);
    } catch (error) {
      message.error('Ошибка отправки ответа');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await api.sendFeedback({
        from_id: user?.id,
        from_name: user?.full_name || user?.login,
        from_login: user?.login,
        subject: values.subject,
        message: values.message
      });
      message.success('Сообщение отправлено!');
      form.resetFields();
      fetchMessages();
    } catch (error) {
      message.error('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Группируем сообщения по треду (оригинал + ответы)
  const groupedMessages = messages.reduce((acc, msg) => {
    if (!msg.parent_id) {
      acc[msg.id] = { original: msg, replies: [] };
    } else if (acc[msg.parent_id]) {
      acc[msg.parent_id].replies.push(msg);
    }
    return acc;
  }, {});

  const sortedThreads = Object.values(groupedMessages).sort((a, b) => 
    new Date(b.original.created_at) - new Date(a.original.created_at)
  );

  const handleReplyClick = (msg) => {
    setReplyingTo(msg);
    setReplyModal({ open: true });
  };

  return (
    <div className="student-feedback-page">
      <Title level={4}>Обратная связь</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Переписка с вашим наставником
      </Text>
      
      {/* Форма отправки */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Тема"
            name="subject"
            rules={[{ required: true, message: 'Введите тему' }]}
          >
            <Input placeholder="Тема вашего вопроса" size="large" />
          </Form.Item>

          <Form.Item
            label="Сообщение"
            name="message"
            rules={[{ required: true, message: 'Введите сообщение' }]}
          >
            <TextArea
              rows={4}
              placeholder="Опишите ваш вопрос или проблему..."
              style={{ resize: 'vertical' }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Отправить сообщение
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Список переписки */}
      <Title level={5}>История переписки</Title>
      
      {sortedThreads.length === 0 ? (
        <Empty description="Нет сообщений" />
      ) : (
        <List
          dataSource={sortedThreads}
          renderItem={(thread) => (
            <List.Item style={{ display: 'block', padding: '16px 0' }}>
              <Card style={{ marginBottom: 12 }}>
                {/* Оригинальное сообщение */}
                <div style={{ 
                  padding: 12, 
                  background: '#f5f5f5', 
                  borderRadius: 6,
                  marginBottom: thread.replies.length > 0 ? 12 : 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>Вы</Text>
                    <Text type="secondary">{formatDate(thread.original.created_at)}</Text>
                  </div>
                  {thread.original.subject && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Тема: </Text>
                      <Text>{thread.original.subject}</Text>
                    </div>
                  )}
                  <div>{thread.original.message}</div>
                  {thread.replies.length > 0 && (
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => handleReplyClick(thread.replies[thread.replies.length - 1])}
                      style={{ marginTop: 8, paddingLeft: 0 }}
                    >
                      ↩ Ответить
                    </Button>
                  )}
                </div>
                
                {/* Ответы ментора */}
                {thread.replies.map((reply, idx) => (
                  <div key={reply.id} style={{ 
                    padding: 12, 
                    background: '#e6f7ff',
                    borderRadius: 6,
                    marginBottom: idx < thread.replies.length - 1 ? 8 : 0
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>Наставник</Text>
                      <Text type="secondary">{formatDate(reply.created_at)}</Text>
                    </div>
                    {reply.message}
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => handleReplyClick(reply)}
                      style={{ marginTop: 8, paddingLeft: 0 }}
                    >
                      ↩ Ответить
                    </Button>
                  </div>
                ))}
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Модальное окно ответа */}
      <Modal
        title={`Ответ: ${replyingTo?.from_name}`}
        open={replyModal.open}
        onCancel={() => {
          setReplyModal({ open: false, message: null });
          setReplyingTo(null);
          replyForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {replyingTo && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <Text strong>От: {replyingTo.from_name}</Text>
              {replyingTo.subject && <div style={{ marginTop: 4 }}>Тема: {replyingTo.subject}</div>}
              <div style={{ marginTop: 4 }}>{replyingTo.message}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(replyingTo.created_at)}
              </Text>
            </div>

            <Form form={replyForm} onFinish={handleReply} layout="vertical">
              <Form.Item
                label="Ваш ответ"
                name="message"
                rules={[{ required: true, message: 'Введите ответ' }]}
              >
                <TextArea
                  rows={6}
                  placeholder="Напишите ответ..."
                  style={{ resize: 'vertical' }}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large">
                  Отправить ответ
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StudentFeedbackPage;
