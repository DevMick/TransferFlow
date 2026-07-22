import { MoonOutlined, SendOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useUIStore } from '../stores/ui-store';

const { Header, Content, Footer } = Layout;

const navItems = [
  { key: '/', label: <NavLink to="/">Home</NavLink> },
  { key: '/transfers', label: <NavLink to="/transfers">Transfers</NavLink> },
  { key: '/login', label: <NavLink to="/login">Sign in</NavLink> },
];

export function RootLayout() {
  const location = useLocation();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Space align="center">
          <SendOutlined style={{ color: '#fff', fontSize: 20 }} />
          <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
            TransferFlow
          </Typography.Text>
        </Space>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button
          type="text"
          aria-label="Toggle theme"
          icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
          style={{ color: '#fff' }}
          onClick={toggleTheme}
        />
      </Header>
      <Content style={{ padding: '32px 48px' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        TransferFlow · Built with React 19, Hono, Drizzle &amp; Better-Auth
      </Footer>
    </Layout>
  );
}
