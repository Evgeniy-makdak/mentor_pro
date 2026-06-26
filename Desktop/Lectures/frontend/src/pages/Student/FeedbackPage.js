import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, message } from 'antd';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const { Title, Text } = Typography;
const { TextArea } = Input;

function StudentFeedbackPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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
    } catch (error) {
      message.error('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-feedback-page">
      <Title level={4}>Обратная связь</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Напишите сообщение вашему наставнику
      </Text>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
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
    </div>
  );
}

export default StudentFeedbackPage;
