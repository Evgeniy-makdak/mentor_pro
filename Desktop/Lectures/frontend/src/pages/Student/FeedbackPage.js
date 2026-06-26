import React, { useState, useEffect } from 'react';
import { Card, Typography, Form, Input, Button, message, Tabs, List, Empty, Tag } from 'antd';
import { useAuth } from '../../AuthContext';
import api from '../../api';
import './FeedbackPage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

function StudentFeedbackPage() {
  const [activeTab, setActiveTab] = useState('write');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      const res = await api.getFeedback();
      // Group by conversation
      const grouped = res.data.reduce((acc, msg) => {
        const convId = msg.parent_id || msg.id;
        if (!acc[convId]) {
          acc[convId] = {
            id: msg.parent_id || msg.id,
            original: msg.parent_id ? null : msg,
            replies: [],
            lastMessage: msg
          };
        }
        if (msg.parent_id) {
          acc[convId].replies.push(msg);
          acc[convId].lastMessage = msg;
        }
        return acc;
      }, {});
      
      setConversations(Object.values(grouped).sort((a, b) => 
        new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
      ));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

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
      setActiveTab('inbox');
      fetchConversations();
    } catch (error) {
      message.error('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conv) => {
    setSelectedConversation(conv);
    setActiveTab('conversation');
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

  const writeTab = (
    <Card>
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
            rows={6}
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
  );

  const inboxTab = (
    <List
      dataSource={conversations}
      locale={{ emptyText: <Empty description="Нет сообщений" /> }}
      renderItem={(conv) => (
        <List.Item>
          <Card 
            onClick={() => handleConversationClick(conv)}
            style={{ width: '100%', cursor: 'pointer' }}
            hoverable
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ fontSize: 15 }}>
                {conv.original?.subject || 'Без темы'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(conv.lastMessage.created_at)}
              </Text>
            </div>
            <div style={{ color: '#666', fontSize: 14 }}>
              {conv.lastMessage.message?.substring(0, 100)}{conv.lastMessage.message?.length > 100 ? '...' : ''}
            </div>
            {conv.replies.length > 0 && (
              <Tag color="blue" style={{ marginTop: 8 }}>
                Ответов: {conv.replies.length}
              </Tag>
            )}
          </Card>
        </List.Item>
      )}
    />
  );

  const conversationTab = selectedConversation ? (
    <div className="conversation-view">
      <Button onClick={() => setActiveTab('inbox')} style={{ marginBottom: 16 }}>
        ← Назад к списку
      </Button>
      
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16 }}>
            {selectedConversation.original?.subject || 'Без темы'}
          </Text>
        </div>
        
        {/* Original message */}
        {selectedConversation.original && (
          <div style={{ 
            padding: 12, 
            background: '#f5f5f5', 
            borderRadius: 6, 
            marginBottom: 12 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Вы</Text>
              <Text type="secondary">{formatDate(selectedConversation.original.created_at)}</Text>
            </div>
            {selectedConversation.original.message}
          </div>
        )}
        
        {/* Replies */}
        {selectedConversation.replies.map((reply, idx) => (
          <div key={reply.id} style={{ 
            padding: 12, 
            background: '#e6f7ff',
            borderRadius: 6,
            marginBottom: 8
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Наставник</Text>
              <Text type="secondary">{formatDate(reply.created_at)}</Text>
            </div>
            {reply.message}
          </div>
        ))}
      </Card>
    </div>
  ) : (
    <Empty description="Выберите переписку" />
  );

  const tabItems = [
    {
      key: 'inbox',
      label: 'Мои сообщения',
      children: inboxTab
    },
    {
      key: 'write',
      label: 'Написать',
      children: writeTab
    },
    {
      key: 'conversation',
      label: 'Переписка',
      children: conversationTab,
      disabled: !selectedConversation
    }
  ];

  return (
    <div className="student-feedback-page">
      <Title level={4}>Обратная связь</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Напишите сообщение вашему наставнику
      </Text>
      
      <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
    </div>
  );
}

export default StudentFeedbackPage;
