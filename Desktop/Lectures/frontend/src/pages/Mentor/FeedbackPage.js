import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Tag, Empty, Button, Modal, Form, Input, message } from 'antd';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const { Text } = Typography;
const { TextArea } = Input;

function FeedbackPage() {
  const [messages, setMessages] = useState([]);
  const [replyModal, setReplyModal] = useState({ open: false, message: null });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm] = Form.useForm();
  const { user } = useAuth();

  const fetchMessages = async () => {
    try {
      const res = await api.getFeedback();
      setMessages(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (messageId) => {
    try {
      await api.markFeedbackRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: 1 } : msg
      ));
    } catch {
      message.error('Ошибка при отметке');
    }
  };

  const handleReply = async (values) => {
    try {
      await api.replyFeedback({
        to_id: replyingTo.from_id,
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
      fetchMessages();
    } catch (error) {
      message.error('Ошибка отправки ответа');
    }
  };

  const handleCardClick = (item) => {
    if (item.is_read === 0) {
      markAsRead(item.id);
    }
    setReplyingTo(item);
    setReplyModal({ open: true, message: item });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="feedback-page">
      <h2>Обратная связь</h2>
      <List
        dataSource={messages}
        locale={{ emptyText: <Empty description="Нет сообщений" /> }}
        renderItem={(item) => (
          <List.Item style={{ cursor: 'pointer' }}>
            <Card 
              onClick={() => handleCardClick(item)}
              style={{ width: '100%' }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{item.from_name} ({item.from_login})</Text>
                <Text type="secondary">{formatDate(item.created_at)}</Text>
              </div>
              {item.subject && <><Text strong>Тема: </Text><Text>{item.subject}</Text></>}
              <div style={{ marginTop: 8 }}><Text>{item.message}</Text></div>
              {item.is_read === 0 && <Tag color="red" style={{ marginTop: 8 }}>Не прочитано</Tag>}
              {item.is_read === 1 && <Tag color="green" style={{ marginTop: 8 }}>Прочитано</Tag>}
              {item.reply && (
                <div style={{ marginTop: 12, padding: 12, background: '#f0f5ff', borderRadius: 6 }}>
                  <Text strong>Ваш ответ:</Text>
                  <div style={{ marginTop: 4 }}>{item.reply}</div>
                  {item.reply_date && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ответ {formatDate(item.reply_date)}
                    </Text>
                  )}
                </div>
              )}
            </Card>
          </List.Item>
        )}
      />

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
              <Text strong>От: {replyingTo.from_name} ({replyingTo.from_login})</Text>
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

export default FeedbackPage;
