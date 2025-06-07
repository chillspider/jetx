import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Badge } from 'antd';
import { 
  DashboardOutlined,
  CameraOutlined,
  LicenseOutlined,
  ApiOutlined,
  SettingOutlined,
  MonitorOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    darkMode, 
    sidebarCollapsed, 
    toggleDarkMode, 
    toggleSidebar, 
    logout 
  } = useAuthStore();

  // Menu items
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/devices',
      icon: <CameraOutlined />,
      label: 'Devices',
    },
    {
      key: '/plates',
      icon: <LicenseOutlined />,
      label: 'Plate Recognition',
    },
    {
      key: '/webhooks',
      icon: <ApiOutlined />,
      label: 'Webhooks',
    },
    {
      key: '/templates',
      icon: <SettingOutlined />,
      label: 'Templates',
    },
    {
      key: '/monitoring',
      icon: <MonitorOutlined />,
      label: 'Monitoring',
    },
  ];

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={sidebarCollapsed}
        theme={darkMode ? 'dark' : 'light'}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 8,
        }}>
          <img 
            src={sidebarCollapsed ? '/logo-small.png' : '/logo.png'} 
            alt=\"CarWash Fleet\"
            style={{ 
              height: sidebarCollapsed ? 32 : 40,
              filter: darkMode ? 'invert(1)' : 'none'
            }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzE4OTBGRiIvPgo8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNXPC90ZXh0Pgo8L3N2Zz4K';
            }}
          />
        </div>

        {/* Navigation Menu */}
        <Menu
          theme={darkMode ? 'dark' : 'light'}
          mode=\"inline\"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200 }}>
        {/* Header */}
        <Header 
          style={{ 
            padding: '0 24px', 
            background: darkMode ? '#141414' : '#fff',
            borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left side - Sidebar toggle */}
          <Button
            type=\"text\"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          {/* Right side - User controls */}
          <Space size=\"middle\">
            {/* Notifications */}
            <Badge count={5} size=\"small\">
              <Button 
                type=\"text\" 
                icon={<BellOutlined />} 
                size=\"large\"
              />
            </Badge>

            {/* Dark mode toggle */}
            <Button
              type=\"text\"
              icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleDarkMode}
              size=\"large\"
            />

            {/* User dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement=\"bottomRight\"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  size=\"small\" 
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                <span style={{ display: sidebarCollapsed ? 'none' : 'inline' }}>
                  {user?.name || 'Admin'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: darkMode ? '#141414' : '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;