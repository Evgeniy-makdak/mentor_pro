import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Button, Dropdown, Drawer } from 'antd';
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
  DashboardOutlined,
  CloseOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useAuth } from '../../AuthContext';
import './MentorLayout.css';

const { Header, Sider, Content } = Layout;

function MentorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Автопрокрутка нижней навигации к активной вкладке
  useEffect(() => {
    if (isMobile && navFooterRef.current) {
      const activeElement = navFooterRef.current.querySelector('.mobile-nav-item.active');
      if (activeElement) {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }
  }, [location.pathname, isMobile]);
  const navFooterRef = useRef(null);

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
      <Sider collapsible width={200} collapsedWidth={64}>
        <div className="mentor-logo">
          <BookOutlined style={{ fontSize: 24, color: '#fff' }} />
          <span className="logo-text">Mentor Pro</span>
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
        <Header className="mentor-header" style={{ padding: '0 16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Кнопка меню для мобильных */}
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            size="large"
            onClick={() => setMobileMenuOpen(true)}
            style={{ display: isMobile ? 'flex' : 'none' }}
          />
          <div style={{ flex: 1 }} />
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }}>
                {user?.full_name?.[0] || user?.login?.[0]}
              </Avatar>
              <span style={{ display: isMobile ? 'none' : 'inline' }}>{user?.full_name || user?.login}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 12, padding: 16, background: '#fff', minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
        
        {/* Нижняя навигация для мобильных */}
        {isMobile && (
          <div className="mobile-nav-footer" ref={navFooterRef}>
            {menuItems.map(item => (
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
        >
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            onClick={(e) => {
              handleMenuClick(e);
              setMobileMenuOpen(false);
            }}
          />
        </Drawer>
      </Layout>
    </Layout>
  );
}

export default MentorLayout;
