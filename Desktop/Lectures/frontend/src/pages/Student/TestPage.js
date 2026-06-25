import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Typography, Button, Radio, Space, Progress, message, Modal } from 'antd';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

function StudentTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timer, setTimer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const attemptId = location.state?.attemptId || location.pathname.split('/test/')[1];

  useEffect(() => {
    if (location.state?.questions) {
      setQuestions(location.state.questions);
      setTimeLeft((location.state.test?.time_limit_minutes || 30) * 60);
    }
  }, [location.state]);

  useEffect(() => {
    if (timeLeft <= 0 || (questions.length > 0 && timeLeft > 0)) {
      if (timeLeft <= 0) handleSubmit();
      return;
    }
    const t = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(t);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setTimer(t);

    return () => { if (t) clearInterval(t); };
  }, [questions.length > 0]);

  const handleAnswer = (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async () => {
    if (submitting || questions.length === 0) return;
    setSubmitting(true);
    try {
      // Save all answers
      for (const [questionId, answerId] of Object.entries(answers)) {
        await api.saveAnswer(attemptId, { question_id: parseInt(questionId), selected_answer_id: parseInt(answerId) });
      }
      // Submit
      const res = await api.submitTest(attemptId);
      navigate(`/student/results/${res.data.grade}`, { state: { result: res.data } });
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка завершения');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) return <div>Загрузка теста...</div>;

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="student-test-page" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5}>Тест</Title>
        <Text strong style={{ color: timeLeft < 60 ? '#ff4d4f' : '#333' }}>
          ⏱ {formatTime(timeLeft)}
        </Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Progress percent={progress} status={answeredCount === questions.length ? 'success' : 'active'} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Отвечено: {answeredCount} / {questions.length}
        </Text>
      </div>

      {questions.map((q, idx) => (
        <Card key={q.id} title={`Вопрос ${idx + 1} (вес: ${q.weight})`} style={{ marginBottom: 16 }}>
          <Paragraph style={{ marginBottom: 12 }}>{q.question_text}</Paragraph>
          <Radio.Group
            value={answers[q.id]}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {q.answers.map(a => (
                <Radio key={a.id} value={a.id}>
                  {a.answer_text}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Card>
      ))}

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Button type="primary" size="large" onClick={handleSubmit}>
          Завершить тест
        </Button>
      </div>
    </div>
  );
}

export default StudentTestPage;
