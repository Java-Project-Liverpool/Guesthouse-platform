import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminUsers } from './pages/AdminUsers';
import { Dashboard } from './pages/Dashboard';
import { GuesthouseDetail } from './pages/GuesthouseDetail';
import { GuesthouseEdit } from './pages/GuesthouseEdit';
import { GuesthouseList } from './pages/GuesthouseList';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';

const AppRoutes: React.FC = () => {
  const { token, isLoading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Protected route check
  const isPublicRoute = path === '/' || path === '/login' || path === '/login/';

  if (isLoading && !isPublicRoute) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-page)',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
        }}
      >
        Loading Dumela Stays...
      </div>
    );
  }

  if (!token && !isPublicRoute) {
    return <Login />;
  }

  // Routing Logic
  if (path === '/' || path === '') {
    return <Landing />;
  }

  if (path === '/login' || path === '/login/') {
    return <Login />;
  }

  if (path === '/dashboard' || path === '/dashboard/') {
    return (
      <AdminLayout activePath="/dashboard" title="Dashboard" subtitle="Platform overview">
        <Dashboard />
      </AdminLayout>
    );
  }

  if (path === '/guesthouses' || path === '/guesthouses/') {
    return (
      <AdminLayout activePath="/guesthouses">
        <GuesthouseList />
      </AdminLayout>
    );
  }

  if (path === '/guesthouses/new' || path === '/guesthouses/new/') {
    return (
      <AdminLayout activePath="/guesthouses">
        <GuesthouseEdit />
      </AdminLayout>
    );
  }

  // Edit route: /guesthouses/:id/edit
  const editMatch = path.match(/^\/guesthouses\/([^/]+)\/edit\/?$/);
  if (editMatch) {
    const id = editMatch[1];
    return (
      <AdminLayout activePath="/guesthouses">
        <GuesthouseEdit id={id} />
      </AdminLayout>
    );
  }

  // Detail route: /guesthouses/:id
  const detailMatch = path.match(/^\/guesthouses\/([^/]+)\/?$/);
  if (detailMatch) {
    const id = detailMatch[1];
    return (
      <AdminLayout activePath="/guesthouses">
        <GuesthouseDetail id={id} />
      </AdminLayout>
    );
  }

  if (path === '/app-users' || path === '/app-users/') {
    return (
      <AdminLayout activePath="/app-users">
        <Users />
      </AdminLayout>
    );
  }

  if (path === '/admin-users' || path === '/admin-users/') {
    return (
      <AdminLayout activePath="/admin-users">
        <AdminUsers />
      </AdminLayout>
    );
  }

  if (path === '/reviews' || path === '/reviews/') {
    return (
      <AdminLayout activePath="/reviews">
        <Reviews />
      </AdminLayout>
    );
  }

  if (path === '/settings' || path === '/settings/') {
    return (
      <AdminLayout activePath="/settings">
        <Settings />
      </AdminLayout>
    );
  }

  // Fallback to Dashboard if authenticated, otherwise Landing
  return (
    <AdminLayout activePath="/dashboard" title="Dashboard" subtitle="Platform overview">
      <Dashboard />
    </AdminLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
