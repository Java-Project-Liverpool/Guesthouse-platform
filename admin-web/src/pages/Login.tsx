import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Field } from '../ui';

export default function Login() {
  const { token, login } = useAuth(); const nav = useNavigate();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (token) return <Navigate to="/" replace />;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    if (pw.length < 8) return setErr('Password must be at least 8 characters.');
    setBusy(true); setErr('');
    try { await login(email, pw); nav('/'); } catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <div className="center"><form className="card" onSubmit={submit} noValidate>
      <h1>Admin login</h1><p className="muted">Sign in to manage listings</p>
      <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></Field>
      <Field label="Password"><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter password" /></Field>
      {err && <p className="ferr" role="alert">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form></div>
  );
}
