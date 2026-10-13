import { createContext, ReactNode, useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, routes } from './api';

interface Ctx { token: string | null; login: (e: string, p: string) => Promise<void>; logout: () => void }
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; user?: { role: string } }>(routes.login, { method: 'POST', body: { email, password } });
    if (r.user && r.user.role !== 'admin') throw new Error('This account is not an admin.');
    localStorage.setItem('token', r.token); setToken(r.token);
  };
  const logout = () => { localStorage.removeItem('token'); setToken(null); };
  return <AuthCtx.Provider value={{ token, login, logout }}>{children}</AuthCtx.Provider>;
}
export function Protected({ children }: { children: ReactNode }) {
  return useAuth().token ? <>{children}</> : <Navigate to="/login" replace />;
}
