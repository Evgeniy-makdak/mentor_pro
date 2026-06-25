import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Tag, Empty } from 'antd';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const { Text } = Typography;

function FeedbackPage() {
  const [messages, setMessages] = useState([]);
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

  return (
    <div className="feedback-page">
      <h2>Обратная связь</h2>
      <List
        dataSource={messages}
        locale={{ emptyText: <Empty description="Нет сообщений" /> }}
        renderItem={(item) => (
          <List.Item>
            <Card style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{item.from_name} ({item.from_login})</Text>
                <Text type="secondary">{new Date(item.created_at).toLocaleString('ru-RU')}</Text>
              </div>
              {item.subject && <><Text strong>Тема: </Text><Text>{item.subject}</Text></>}
              <div style={{ marginTop: 8 }}><Text>{item.message}</Text></div>
              {item.is_read === 0 && <Tag color="red" style={{ marginTop: 8 }}>Не прочитано</Tag>}
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}

export default FeedbackPage;
