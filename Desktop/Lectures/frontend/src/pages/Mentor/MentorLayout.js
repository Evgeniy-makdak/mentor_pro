import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Button, Dropdown } from 'antd';
import {
  UnorderedListOutlined,
  GroupOutlined,
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useAuth } from '../../AuthContext';
import './MentorLayout.css';

const { Header, Sider, Content } = Layout;

function MentorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/mentor',
      icon: <DashboardOutlined />,
      label: 'Главная'
    },
    {
      key: '/mentor/disciplines',
      icon: <UnorderedListOutlined />,
      label: 'Дисциплины'
    },
    {
      key: '/mentor/groups',
      icon: <GroupOutlined />,
      label: 'Группы'
    },
    {
      key: '/mentor/students',
      icon: <TeamOutlined />,
      label: 'Студенты'
    },
    {
      key: '/mentor/lectures',
      icon: <BookOutlined />,
      label: 'Лекции'
    },
    {
      key: '/mentor/tests',
      icon: <FileTextOutlined />,
      label: 'Тесты'
    },
    {
      key: '/mentor/reports',
      icon: <BarChartOutlined />,
      label: 'Отчёты'
    },
    {
      key: '/mentor/feedback',
      icon: <MessageOutlined />,
      label: 'Обратная связь'
    }
  ];

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const dropdownItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: () => { logout(); navigate('/login'); }
    }
  ];

  // Get selected key from pathname - fixed logic
  const getSelectedKey = () => {
    const path = location.pathname;
    console.log('Menu path:', path);
    
    // Handle root mentor path
    if (path === '/mentor' || path === '/') return '/mentor';
    
    // Extract base path (first two segments)
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const basePath = '/' + parts[0] + '/' + parts[1];
      console.log('Base path:', basePath);
      return basePath;
    }
    
    return '/mentor';
  };

  return (
    <Layout className="mentor-layout">
      <Sider collapsible>
        <div className="mentor-logo">
          <BookOutlined style={{ fontSize: 24, color: '#fff' }} />
          <span>Mentor Pro</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="mentor-header" style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }}>
                {user?.full_name?.[0] || user?.login?.[0]}
              </Avatar>
              <span>{user?.full_name || user?.login}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MentorLayout;
