import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Tag, Empty, Button, Modal, Form, Input, message, Badge, Tabs } from 'antd';
import { useAuth } from '../../AuthContext';
import api from '../../api';
import './FeedbackPage.css';

const { Text } = Typography;
const { TextArea } = Input;

function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyModal, setReplyModal] = useState({ open: false, message: null });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm] = Form.useForm();
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      const res = await api.getFeedback();
      // Group by conversation (original message + replies)
      const grouped = res.data.reduce((acc, msg) => {
        const convId = msg.parent_id || msg.id;
        if (!acc[convId]) {
          acc[convId] = {
            id: msg.parent_id || msg.id,
            original: msg.parent_id ? null : msg,
            replies: [],
            unread: msg.is_read === 0,
            lastMessage: msg,
            student: { name: msg.from_name, login: msg.from_login, id: msg.from_user_id }
          };
        }
        if (msg.parent_id) {
          acc[convId].replies.push(msg);
          acc[convId].lastMessage = msg;
        }
        if (msg.is_read === 0 && !msg.parent_id) {
          acc[convId].unread = true;
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

  const markAsRead = async (messageId) => {
    try {
      await api.markFeedbackRead(messageId);
      setConversations(prev => prev.map(conv => 
        conv.id === messageId ? { ...conv, unread: false } : conv
      ));
    } catch (error) {
      console.error('Ошибка при отметке прочитанным:', error);
      // Не показываем ошибку пользователю, так как это фоновая операция
    }
  };

  const handleReply = async (values) => {
    try {
      await api.replyFeedback({
        to_id: replyingTo.from_id || replyingTo.to_id,
        to_name: replyingTo.from_name || replyingTo.to_name,
        to_login: replyingTo.from_login || replyingTo.to_login,
        original_feedback_id: replyingTo.id,
        subject: `Re: ${replyingTo.subject || 'Без темы'}`,
        message: values.message
      });
      message.success('Ответ отправлен!');
      setReplyModal({ open: false, message: null });
      setReplyingTo(null);
      replyForm.resetFields();
      setTimeout(() => fetchConversations(), 300);
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Ошибка отправки ответа';
      message.error(errorMsg);
    }
  };

  const handleConversationClick = (conv) => {
    if (conv.unread && conv.original) {
      markAsRead(conv.original.id);
    }
    setSelectedConversation(conv);
    setActiveTab('conversation');
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
      minute: '2-digit'
    });
  };

  const inboxTab = (
    <List
      dataSource={conversations}
      locale={{ emptyText: <Empty description="Нет сообщений" /> }}
      renderItem={(conv) => (
        <List.Item>
          <Card 
            onClick={() => handleConversationClick(conv)}
            style={{ 
              width: '100%', 
              cursor: 'pointer',
              borderLeft: conv.unread ? '4px solid #1890ff' : '4px solid transparent'
            }}
            hoverable
            className={conv.unread ? 'feedback-card-unread' : ''}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  {conv.student.name} {conv.unread && <span style={{ color: '#1890ff', marginLeft: 8 }}>●</span>}
                </Text>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {conv.original?.subject || 'Без темы'}
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(conv.lastMessage.created_at)}</Text>
            </div>
            <div style={{ color: '#666', marginTop: 8, fontSize: 14 }}>
              {conv.lastMessage.message?.substring(0, 100)}{conv.lastMessage.message?.length > 100 ? '...' : ''}
            </div>
            {conv.replies.length > 0 && (
              <Tag color="blue" style={{ marginTop: 8 }}>
                Переписка ({conv.replies.length})
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16 }}>
            {selectedConversation.student.name} ({selectedConversation.student.login})
          </Text>
          <Text type="secondary">{formatDate(selectedConversation.original?.created_at)}</Text>
        </div>
        {selectedConversation.original?.subject && (
          <div style={{ marginBottom: 8 }}>
            <Text strong>Тема: </Text>
            <Text>{selectedConversation.original.subject}</Text>
          </div>
        )}
        <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, marginBottom: 12 }}>
          {selectedConversation.original?.message}
        </div>
        {selectedConversation.replies.map((reply, idx) => (
          <div key={reply.id} style={{ 
            padding: 12, 
            background: idx % 2 === 0 ? '#e6f7ff' : '#f6ffed',
            borderRadius: 6,
            marginBottom: 8,
            marginLeft: idx % 2 === 0 ? 0 : 40
          }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              {formatDate(reply.created_at)}
            </Text>
            {reply.message}
          </div>
        ))}
      </Card>

      <Card>
        <Form form={replyForm} onFinish={handleReply} layout="vertical">
          <Form.Item
            label="Ваш ответ"
            name="message"
            rules={[{ required: true, message: 'Введите ответ' }]}
          >
            <TextArea
              rows={4}
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
      </Card>
    </div>
  ) : (
    <Empty description="Выберите переписку" />
  );

  const tabItems = [
    {
      key: 'inbox',
      label: `Входящие (${conversations.filter(c => c.unread).length})`,
      children: inboxTab
    },
    {
      key: 'conversation',
      label: 'Переписка',
      children: conversationTab,
      disabled: !selectedConversation
    }
  ];

  return (
    <div className="feedback-page">
      <h2>Обратная связь</h2>
      <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
    </div>
  );
}

export default FeedbackPage;
