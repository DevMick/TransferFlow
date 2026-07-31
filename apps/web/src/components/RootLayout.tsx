import {
  BankOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SendOutlined,
  SunOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Layout, Menu, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { signOut, useSession } from '../lib/auth-client';
import { useUIStore } from '../stores/ui-store';

const { Header, Sider, Content, Footer } = Layout;

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
  { key: '/transfers', icon: <SwapOutlined />, label: 'Virements' },
  { key: '/establishments', icon: <BankOutlined />, label: 'Établissements' },
  { key: '/profile', icon: <UserOutlined />, label: 'Profil' },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 992px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function NavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const items = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => {
      navigate(item.key);
      onNavigate?.();
    },
  }));

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={items}
      className="tf-sidebar-menu"
    />
  );
}

interface AppHeaderProps {
  isDesktop: boolean;
  onOpenMenu: () => void;
}

function AppHeader({ isDesktop, onOpenMenu }: AppHeaderProps) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <Header className="tf-app-header">
      {!isDesktop && (
        <Button
          type="text"
          aria-label="Ouvrir le menu"
          icon={<MenuOutlined />}
          style={{ color: '#fff' }}
          onClick={onOpenMenu}
        />
      )}
      <button type="button" className="tf-logo tf-logo-btn" onClick={() => navigate('/dashboard')}>
        <SendOutlined style={{ color: '#fff', fontSize: 20 }} />
        <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
          TransferFlow
        </Typography.Text>
      </button>

      <div className="tf-header-spacer" />

      <Button
        type="text"
        aria-label="Changer de thème"
        icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
        style={{ color: '#fff' }}
        onClick={toggleTheme}
      />

      <button type="button" className="tf-header-user" onClick={() => navigate('/profile')}>
        <Avatar size={32} style={{ background: 'var(--tf-accent)', flexShrink: 0 }}>
          {getInitials(session?.user.name, session?.user.email)}
        </Avatar>
        <span className="tf-header-user-text">
          <span className="tf-user-card-name">{session?.user.name || 'Mon compte'}</span>
          <span className="tf-user-card-email">{session?.user.email}</span>
        </span>
      </button>

      <Button
        type="text"
        danger
        aria-label="Déconnexion"
        icon={<LogoutOutlined />}
        style={{ color: '#fff' }}
        onClick={() => signOut()}
      />
    </Header>
  );
}

function PublicHeader() {
  const location = useLocation();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const publicNavItems = [
    { key: '/home', label: <NavLink to="/home">Accueil</NavLink> },
    { key: '/login', label: <NavLink to="/login">Connexion</NavLink> },
  ];

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingInline: 16,
      }}
    >
      <a href="/" className="tf-logo">
        <SendOutlined style={{ color: '#fff', fontSize: 20 }} />
        <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
          TransferFlow
        </Typography.Text>
      </a>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={publicNavItems}
        style={{ flex: 1, minWidth: 0, background: 'transparent' }}
      />
      <Button
        type="text"
        aria-label="Changer de thème"
        icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
        style={{ color: '#fff' }}
        onClick={toggleTheme}
      />
    </Header>
  );
}

export function RootLayout() {
  const { data: session } = useSession();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) {
    if (location.pathname === '/login') {
      return (
        <Layout style={{ minHeight: '100vh' }}>
          <Content style={{ padding: '16px 16px 32px' }}>
            <div className="tf-page">
              <Outlet />
            </div>
          </Content>
        </Layout>
      );
    }

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <PublicHeader />
        <Content style={{ padding: '16px 16px 32px' }}>
          <div className="tf-page">
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', fontSize: 13 }}>
          TransferFlow · Réalisé avec React 19, Hono, Drizzle & Better-Auth
        </Footer>
      </Layout>
    );
  }

  const siderWidth = collapsed ? 80 : 240;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader isDesktop={isDesktop} onOpenMenu={() => setMobileOpen(true)} />

      <Layout hasSider={isDesktop}>
        {isDesktop && (
          <Sider
            theme="dark"
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            collapsedWidth={80}
            className="tf-sider"
            style={{
              position: 'fixed',
              insetInlineStart: 0,
              top: 'var(--tf-header-height)',
              bottom: 0,
              zIndex: 10,
            }}
          >
            <div className="tf-sidebar">
              <NavMenu />
            </div>
            <Button
              type="text"
              className="tf-sider-collapse-btn"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
          </Sider>
        )}

        {!isDesktop && (
          <Drawer
            placement="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            width={260}
            title={
              <Space align="center">
                <SendOutlined />
                <span>TransferFlow</span>
              </Space>
            }
            styles={{ body: { padding: 0, background: '#1e1b4b' } }}
          >
            <NavMenu onNavigate={() => setMobileOpen(false)} />
          </Drawer>
        )}

        <Layout
          style={
            isDesktop
              ? { marginInlineStart: siderWidth, transition: 'margin-inline-start 0.2s' }
              : undefined
          }
        >
          <Content style={{ padding: '16px 16px 32px' }}>
            <div className="tf-page">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
