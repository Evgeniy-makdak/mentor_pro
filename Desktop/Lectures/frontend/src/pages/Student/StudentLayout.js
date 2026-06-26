import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Drawer } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useAuth } from '../../AuthContext';
import './StudentLayout.css';

const { Header, Sider, Content } = Layout;

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const studentMenuItems = [
    {
      key: '/student',
      icon: <BookOutlined />,
      label: 'Лекции'
    },
    {
      key: '/student/results',
      icon: <FileTextOutlined />,
      label: 'Результаты'
    },
    {
      key: '/student/feedback',
      icon: <MessageOutlined />,
      label: 'Обратная связь'
    }
  ];

  const footerItems = [
    { key: '/student', label: 'Лекции' },
    { key: '/student/results', label: 'Результаты' },
    { key: '/student/feedback', label: 'Обратная связь' }
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/student' || path === '/student/') return '/student';
    if (path.startsWith('/student/feedback')) return '/student/feedback';
    return path;
  };

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

  return (
    <Layout className="student-layout">
      <Sider 
        collapsible 
        width={200} 
        collapsedWidth={64}
        className="student-layout-sider"
      >
        <div className="student-logo">
          <BookOutlined style={{ fontSize: 24, color: '#fff' }} />
          <span>Mentor Pro</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={studentMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="student-header" style={{ padding: '0 16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Кнопка меню для мобильных */}
          {isMobile && (
            <Button 
              type="text" 
              icon={<MenuOutlined />} 
              size="large"
              onClick={() => setMobileMenuOpen(true)}
              style={{ color: '#333', marginRight: 8 }}
            />
          )}
          <div style={{ flex: 1 }} />
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff', width: 40, height: 40 }}>
                {user?.full_name?.[0] || user?.login?.[0]}
              </Avatar>
              {!isMobile && <span>{user?.full_name || user?.login}</span>}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 12, padding: 16, background: '#fff', minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
        
        {/* Нижняя навигация для мобильных */}
        {isMobile && (
          <div className="mobile-nav-footer">
            {footerItems.map(item => (
              <div
                key={item.key}
                className={`mobile-nav-item ${getSelectedKey() === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
        
        {/* Drawer меню для мобильных */}
        <Drawer
          title="Меню"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
          className="student-mobile-drawer"
        >
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={studentMenuItems}
            onClick={(e) => {
              handleMenuClick(e);
              setMobileMenuOpen(false);
            }}
            style={{ fontSize: 16 }}
          />
        </Drawer>
      </Layout>
    </Layout>
  );
}

export default StudentLayout;
