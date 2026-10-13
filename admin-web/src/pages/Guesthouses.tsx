import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, Guesthouse, imgUrl, routes, useApi } from '../api';
import { Field, fmtP, State, Stars } from '../ui';

export function GuesthouseList() {
  const { data, loading, error, reload } = useApi<Guesthouse[]>(routes.guesthouses);
  const [q, setQ] = useState(''); const [msg, setMsg] = useState('');
  const rows = (data ?? []).filter(g => (g.name + g.city).toLowerCase().includes(q.toLowerCase()));
  const act = async (fn: () => Promise<unknown>) => { setMsg(''); try { await fn(); reload(); } catch (e) { setMsg((e as Error).message); } };
  return (<>
    <div className="bar"><div><h1>Guesthouses</h1><p className="muted">{data?.length ?? 0} registered</p></div>
      <Link className="btn" to="/guesthouses/new">Register guesthouse</Link></div>
    <input className="search" placeholder="Search by name or city" value={q} onChange={e => setQ(e.target.value)} />
    {msg && <p className="ferr" role="alert">{msg}</p>}
    <State loading={loading} error={error} retry={reload} empty={!rows.length} emptyText={q ? 'No guesthouses match your search.' : 'No guesthouses yet. Register the first one.'}>
      <div className="card scroll"><table><thead><tr><th>Guesthouse</th><th>City</th><th>Price / night</th><th>Rating</th><th>Status</th><th /></tr></thead><tbody>
        {rows.map(g => <tr key={g._id}>
          <td><b>{g.name}</b></td><td>{g.city}</td><td>{fmtP(g.pricePerNight)}</td><td><Stars n={g.avgRating ?? 0} /></td>
          <td>{g.verificationStatus[0].toUpperCase() + g.verificationStatus.slice(1)}</td>
          <td className="acts">
            <Link className="btn ghost" to={`/guesthouses/${g._id}`}>Edit</Link>
            <button className="btn ghost danger" onClick={() => confirm(`Deactivate ${g.name}? It disappears from the app but its ratings are kept.`) && act(() => api(`${routes.guesthouses}/${g._id}`, { method: 'DELETE' }))}>Deactivate</button>
          </td></tr>)}
      </tbody></table></div>
    </State></>);
}

const AMEN = ['Wi-Fi', 'Pool', 'Breakfast', 'Parking'];
const blank = { name: '', description: '', city: '', country: 'Botswana', latitude: '', longitude: '', price: '', phone: '', email: '', amenities: [] as string[], logo: '', gallery: '' };

export function GuesthouseForm() {
  const { id } = useParams(); const nav = useNavigate();
  const existing = useApi<Guesthouse>(id ? `${routes.guesthouses}/${id}` : '');
  const [f, setF] = useState(blank); const [logo, setLogo] = useState<File>(); const [gallery, setGallery] = useState<FileList | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const g = existing.data; if (!id || !g) return;
    setF({ name: g.name, description: g.description, city: g.city, country: g.country, latitude: String(g.location.latitude), longitude: String(g.location.longitude),
      price: String(g.pricePerNight), phone: g.contact.phone, email: g.contact.email, amenities: g.amenities, logo: g.logo ?? '', gallery: (g.gallery ?? []).join('\n') });
  }, [existing.data, id]);
  const set = (k: keyof typeof blank, v: unknown) => setF(p => ({ ...p, [k]: v }));
  const validate = () => {
    const e: Record<string, string> = {}; const lat = Number(f.latitude), lng = Number(f.longitude);
    if (!f.name.trim()) e.name = 'Enter a name.';
    if (!f.description.trim()) e.description = 'Enter a description.';
    if (!f.logo.trim()) e.logo = 'Enter the logo path or URL.';
    if (!f.city.trim()) e.city = 'Enter a city.';
    if (!f.country.trim()) e.country = 'Enter a country.';
    if (!(Number(f.price) > 0)) e.price = 'Enter a price above 0.';
    if (f.latitude === '' || lat < -90 || lat > 90) e.latitude = 'Latitude must be -90 to 90.';
    if (f.longitude === '' || lng < -180 || lng > 180) e.longitude = 'Longitude must be -180 to 180.';
    if (!/^\+?[\d\s-]{7,}$/.test(f.phone)) e.phone = 'Enter a valid phone number.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email.';
    setErrs(e); return !Object.keys(e).length;
  };
  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); if (!validate()) return;
    const body = { name: f.name, description: f.description, city: f.city, country: f.country, pricePerNight: +f.price,
      location: { latitude: +f.latitude, longitude: +f.longitude }, contact: { phone: f.phone, email: f.email }, amenities: f.amenities, logo: f.logo.trim(), gallery: f.gallery.split('\n').map(x => x.trim()).filter(Boolean) };
    setBusy(true); setMsg('');
    try { await api(id ? `${routes.guesthouses}/${id}` : routes.guesthouses, { method: id ? 'PUT' : 'POST', body }); nav('/guesthouses'); }
    catch (x) { setMsg((x as Error).message); setBusy(false); }
  };
  const txt = (k: keyof typeof blank, label: string, type = 'text') =>
    <Field label={label} error={errs[k]}><input type={type} value={f[k] as string} onChange={e => set(k, e.target.value)} /></Field>;
  return (<>
    <h1>{id ? 'Edit guesthouse' : 'Register guesthouse'}</h1>
    <State loading={!!id && existing.loading} error={id ? existing.error : undefined} retry={existing.reload}>
      <form className="card form" onSubmit={submit} noValidate>
        {txt('name', 'Name')}
        <Field label="Description" error={errs.description}><textarea rows={3} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
        <fieldset><legend>Amenities</legend>{AMEN.map(a => <label key={a} className="chk"><input type="checkbox" checked={f.amenities.includes(a)}
          onChange={e => set('amenities', e.target.checked ? [...f.amenities, a] : f.amenities.filter(x => x !== a))} />{a}</label>)}</fieldset>
        <div className="two">{txt('city', 'City')}{txt('country', 'Country')}{txt('latitude', 'Latitude', 'number')}{txt('longitude', 'Longitude', 'number')}
          {txt('price', 'Price per night (P)', 'number')}{txt('phone', 'Phone')}</div>
        {txt('email', 'Email')}
        {txt('logo', 'Logo path or URL')}
        <Field label="Gallery paths or URLs (one per line)"><textarea rows={3} value={f.gallery} onChange={e => set('gallery', e.target.value)} /></Field>
        {msg && <p className="ferr" role="alert">{msg}</p>}
        <div className="acts"><Link className="btn ghost" to="/guesthouses">Cancel</Link><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save guesthouse'}</button></div>
      </form>
    </State></>);
}
