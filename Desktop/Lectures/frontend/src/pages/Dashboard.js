import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Typography, Card, Avatar, Row, Col } from 'antd';
import { UserOutlined, UnorderedListOutlined, GroupOutlined, TeamOutlined, BookOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleLabel = user.role === 'mentor' ? 'Наставник' : 'Студент';

  const menuCards = [
    {
      title: 'Дисциплины',
      icon: <UnorderedListOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      path: '/mentor/disciplines',
      color: '#1890ff'
    },
    {
      title: 'Группы',
      icon: <GroupOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      path: '/mentor/groups',
      color: '#52c41a'
    },
    {
      title: 'Студенты',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      path: '/mentor/students',
      color: '#722ed1'
    },
    {
      title: 'Лекции',
      icon: <BookOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      path: '/mentor/lectures',
      color: '#fa8c16'
    },
    {
      title: 'Тесты',
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      path: '/mentor/tests',
      color: '#eb2f96'
    },
    {
      title: 'Отчёты',
      icon: <BarChartOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
      path: '/mentor/reports',
      color: '#13c2c2'
    },
    {
      title: 'Обратная связь',
      icon: <UserOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      path: '/mentor/feedback',
      color: '#faad14'
    }
  ];

  return (
    <div className="dashboard-page" style={{ padding: '0 20px' }}>
      <Title level={3}>Добро пожаловать, {user?.full_name || user?.login}!</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Роль: {roleLabel}
      </Text>

      <Row gutter={[16, 16]}>
        {menuCards.map(card => (
          <Col xs={24} sm={12} md={8} lg={6} key={card.path}>
            <Card
              hoverable
              onClick={() => navigate(card.path)}
              style={{ cursor: 'pointer', textAlign: 'center', borderRadius: 8 }}
            >
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: 8 }}>{card.icon}</div>
                <Text strong style={{ fontSize: 16 }}>{card.title}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default Dashboard;
