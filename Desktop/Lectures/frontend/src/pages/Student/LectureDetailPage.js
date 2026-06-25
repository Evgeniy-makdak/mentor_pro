import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Space, Alert, message, Tag, Collapse, Empty } from 'antd';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

function StudentLectureDetailPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [lectureTitle, setLectureTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await api.getTestInfo(lectureId);
        setTestInfo(info.data);
      } catch {
        setTestInfo(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [lectureId]);

  const handleStartTest = async () => {
    if (!testInfo?.test) return;
    try {
      const res = await api.startTest(testInfo.test.id);
      navigate(`/student/test/`, {
        state: { test: res.data.test, questions: res.data.questions, attemptId: res.data.attempt.id }
      });
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка запуска теста');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  if (!testInfo) return <Empty description="Тесты не найдены" />;

  const gradeText = testInfo.lastAttempt?.grade ? {
    5: { text: 'Отлично', color: 'green' },
    4: { text: 'Хорошо', color: 'blue' },
    3: { text: 'Удовл.', color: 'orange' },
    2: { text: 'Неуд.', color: 'red' },
    1: { text: 'Неуд.', color: 'red' },
  }[testInfo.lastAttempt.grade] : null;

  return (
    <div className="student-lecture-detail-page">
      <Title level={4}>Лекция {lectureId}</Title>
      
      {testInfo.isActive ? (
        <Alert
          message="Тест доступен"
          description={`Попытка ${testInfo.attemptsUsed + 1} из ${testInfo.attemptsAllowed}`}
          type="success"
          style={{ marginBottom: 16 }}
          action={
            <Button type="primary" onClick={handleStartTest}>Начать тест</Button>
          }
        />
      ) : testInfo.attemptsUsed >= testInfo.attemptsAllowed ? (
        <Alert
          message="Попытки исчерпаны"
          description="Все попытки использованы"
          type="warning"
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          message="Тест пока недоступен"
          description="Ожидайте начала теста"
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      {testInfo.lastAttempt && (
        <Card style={{ marginBottom: 16 }}>
          <Title level={5}>Последняя попытка</Title>
          <Space>
            <Text>Баллы: {testInfo.lastAttempt.score} / {testInfo.lastAttempt.total_possible}</Text>
            <Text>Процент: {testInfo.percentage}%</Text>
            {gradeText && <Tag color={gradeText.color}>{gradeText.text}</Tag>}
          </Space>
        </Card>
      )}

      <Button onClick={() => navigate('/student')}>← Назад к лекциям</Button>
    </div>
  );
}

export default StudentLectureDetailPage;
