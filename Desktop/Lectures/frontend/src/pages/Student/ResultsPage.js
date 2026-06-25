import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Alert, message, Empty, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

function StudentResultsPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.getTestInfo(lectureId);
        setTestInfo(res.data);
      } catch {
        message.error('Ошибка загрузки результатов');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [lectureId]);

  if (loading) return <div>Загрузка...</div>;
  if (!testInfo) return <Empty description="Нет результатов" />;

  const gradeText = testInfo.lastAttempt?.grade ? {
    5: { text: 'Отлично (5)', color: 'green' },
    4: { text: 'Хорошо (4)', color: 'blue' },
    3: { text: 'Удовлетворительно (3)', color: 'orange' },
    2: { text: 'Неудовлетворительно (2)', color: 'red' },
    1: { text: 'Неудовлетворительно (1)', color: 'red' },
  }[testInfo.lastAttempt.grade] : null;

  return (
    <div className="student-results-page">
      <Button onClick={() => navigate('/student')} style={{ marginBottom: 16 }} icon={<ArrowLeftOutlined />}>
        ← Назад
      </Button>
      <Title level={4}>Результаты</Title>

      {testInfo.lastAttempt ? (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="middle">
            <div>
              <Text type="secondary">Итого:</Text>
              <Text strong style={{ marginLeft: 16 }}>
                Баллы: {testInfo.lastAttempt.score} / {testInfo.lastAttempt.total_possible}
              </Text>
              <Text strong style={{ marginLeft: 16 }}>
                Процент: {testInfo.lastAttempt.percentage}%
              </Text>
              {gradeText && <Tag color={gradeText.color} style={{ marginLeft: 16 }}>{gradeText.text}</Tag>}
            </div>
            <div>
              <Text type="secondary">Попытка {testInfo.attemptsUsed} из {testInfo.attemptsAllowed}</Text>
            </div>
          </Space>
        </Card>
      ) : (
        <Alert message="У вас пока нет результатов по этому тесту" type="info" style={{ marginBottom: 16 }} />
      )}

      {testInfo.isActive && (
        <Button type="primary" onClick={() => navigate(`/student/lecture/${lectureId}`)} style={{ marginBottom: 16 }}>
          Пройти тест
        </Button>
      )}
    </div>
  );
}

export default StudentResultsPage;
