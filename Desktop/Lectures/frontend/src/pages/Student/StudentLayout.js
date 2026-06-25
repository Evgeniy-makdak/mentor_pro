import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../../AuthContext';
import './StudentLayout.css';

const { Header, Sider, Content } = Layout;

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/student',
      icon: <BookOutlined />,
      label: 'Лекции'
    },
    {
      key: '/student/results',
      icon: <FileTextOutlined />,
      label: 'Результаты'
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

  return (
    <Layout className="student-layout">
      <Sider collapsible>
        <div className="student-logo">
          <BookOutlined style={{ fontSize: 24, color: '#fff' }} />
          <span>Mentor Pro</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="student-header" style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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

export default StudentLayout;
