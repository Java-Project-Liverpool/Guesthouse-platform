import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, Protected, useAuth } from './auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { GuesthouseList, GuesthouseForm } from './pages/Guesthouses';
import { Reviews, Admins, Notifications } from './pages/Other';

function Layout() {
  const { logout } = useAuth();
  const links = [['/', 'Dashboard'], ['/guesthouses', 'Guesthouses'], ['/reviews', 'Reviews'], ['/admins', 'Admin users'], ['/notifications', 'Notifications']];
  return (
    <div className="shell">
      <nav className="side">
        <b className="brand">Dumela Stays<small>Admin portal</small></b>
        {links.map(([to, t]) => <NavLink key={to} to={to} end={to === '/'}>{t}</NavLink>)}
        <button className="btn ghost" onClick={logout}>Log out</button>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="guesthouses" element={<GuesthouseList />} />
          <Route path="guesthouses/new" element={<GuesthouseForm />} />
          <Route path="guesthouses/:id" element={<GuesthouseForm />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="admins" element={<Admins />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
