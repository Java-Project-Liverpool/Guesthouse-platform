import { FormEvent, useState } from 'react';
import { AdminUser, api, Notice, Review, routes, useApi } from '../api';
import { Field, State, Stars } from '../ui';

// Review fields can be a populated object or a plain id; this picks the name.
const nm = (x: { name: string } | string) => (typeof x === 'string' ? x : x.name);
const day = (d: string) => new Date(d).toLocaleDateString();

// Reviews page with All and Reported tabs. Needs a ratings router on the backend.
export function Reviews() {
  const [tab, setTab] = useState<'all' | 'reported'>('all'); const [msg, setMsg] = useState('');
  const { data, loading, error, reload } = useApi<Review[]>(tab === 'all' ? routes.reviews : routes.reported);
  // Dismiss a report or remove a review, then reload.
  const act = async (path: string, method: string) => { setMsg(''); try { await api(path, { method }); reload(); } catch (e) { setMsg((e as Error).message); } };
  return (<><h1>Reviews</h1><p className="muted">Ratings and comments from customers</p>
    <div className="tabs">{(['all', 'reported'] as const).map(t => <button key={t} className={'btn ' + (tab === t ? '' : 'ghost')} onClick={() => setTab(t)}>{t === 'all' ? 'All reviews' : 'Reported'}</button>)}</div>
    {msg && <p className="ferr" role="alert">{msg}</p>}
    <State loading={loading} error={error} retry={reload} empty={!data?.length} emptyText={tab === 'all' ? 'No reviews yet.' : 'No reported reviews. Nothing needs your attention.'}>
      {data?.map(r => <div className="card review" key={r._id}>
        <div className="bar"><b>{nm(r.guesthouseId)}</b><Stars n={r.rating} /></div>
        <p>{r.comment || <span className="muted">No comment.</span>}</p>
        <small className="muted">{nm(r.customerId)} · {day(r.createdAt)}{r.reportReason && ` · Reported: ${r.reportReason}`}</small>
        <div className="acts">
          {r.reported && <button className="btn ghost" onClick={() => act(`${routes.reviews}/${r._id}/dismiss-report`, 'POST')}>Dismiss report</button>}
          <button className="btn ghost danger" onClick={() => confirm('Remove this review?') && act(`${routes.reviews}/${r._id}`, 'DELETE')}>Remove review</button>
        </div></div>)}
    </State></>);
}

// Lists admin accounts and lets an admin create another one.
export function Admins() {
  const { data, loading, error, reload } = useApi<AdminUser[]>(routes.admins);
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState('');
  // Validate, then create the admin. The backend always assigns the admin role.
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Enter a name.');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email.');
    if (f.password.length < 8) return setErr('Temporary password must be at least 8 characters.');
    try { await api(routes.admins, { method: 'POST', body: f }); setF({ name: '', email: '', password: '' }); setErr(''); reload(); } catch (x) { setErr((x as Error).message); }
  };
  return (<><h1>Admin users</h1><p className="muted">People who can log in</p>
    <State loading={loading} error={error} retry={reload} empty={!data?.length} emptyText="No admin users found.">
      <div className="card scroll"><table><thead><tr><th>Name</th><th>Email</th></tr></thead><tbody>{data?.map(a => <tr key={a._id}><td><b>{a.name}</b></td><td>{a.email}</td></tr>)}</tbody></table></div>
    </State>
    <form className="card form" onSubmit={submit} noValidate><h2>Create new admin</h2>
      <div className="two"><Field label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email"><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Temporary password"><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></Field></div>
      {err && <p className="ferr" role="alert">{err}</p>}<button className="btn">Create admin</button></form></>);
}

// Activity feed. If the backend has no notifications route yet, a friendly message is shown.
export function Notifications() {
  const { data, loading, error, reload } = useApi<Notice[]>(routes.notifications);
  // A 404 means the route is not built yet, not a real error.
  const off = error?.status === 404;
  return (<><h1>Notifications</h1><p className="muted">New ratings, sign-ups and listing activity</p>
    <State loading={loading} error={off ? undefined : error} retry={reload} empty={off || !data?.length}
      emptyText={off ? 'Notifications are not available from the API yet.' : 'No activity yet.'}>
      {data?.map(n => <div className="card" key={n._id}><b>{n.message}</b><br /><small className="muted">{day(n.createdAt)}</small></div>)}
    </State></>);
}
