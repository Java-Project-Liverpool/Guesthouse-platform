import React, { useState } from 'react';
import {
  DashboardIcon,
  GuesthouseIcon,
  AppUsersIcon,
  AdminUsersIcon,
  ReviewsIcon,
  SettingsIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
} from '../components/ui/Icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

import logoImg from '../assets/logo.png';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activePath,
  title,
  subtitle,
  headerAction,
}) => {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { name: 'Guesthouses', path: '/guesthouses', icon: GuesthouseIcon },
    { name: 'App users', path: '/app-users', icon: AppUsersIcon },
    { name: 'Admin users', path: '/admin-users', icon: AdminUsersIcon },
    { name: 'Reviews', path: '/reviews', icon: ReviewsIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  // Derive initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          background: 'var(--bg-sidebar)',
          color: 'var(--sidebar-text)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transition: 'transform 0.3s ease',
          padding: '1.75rem 1.25rem',
        }}
        className={mobileMenuOpen ? 'mobile-open' : ''}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
          <img src={logoImg} alt="Dumela Stays logo" style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }} />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Dumela Stays
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sidebar-muted)' }}>Admin portal</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive =
              activePath === item.path ||
              (item.path !== '/dashboard' && activePath.startsWith(item.path));
            const Icon = item.icon;

            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', item.path);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 14,
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--sidebar-muted)',
              fontSize: '0.9rem',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            {resolvedTheme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            <span>Theme: {theme}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--sidebar-muted)',
              fontSize: '0.95rem',
              fontWeight: 500,
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <LogoutIcon size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: 260,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <header
          style={{
            padding: '1.75rem 2.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-main)',
            background: 'var(--bg-page)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div>
            {title && (
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {headerAction}

            {/* Quick theme button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch theme (current: ${theme})`}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid var(--border-main)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {resolvedTheme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {/* Admin Avatar */}
            <a
              href="/settings"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/settings');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              title={user?.email || 'Admin Settings'}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {initials}
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem 2.5rem 3rem', flex: 1, maxWidth: 1200, width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
