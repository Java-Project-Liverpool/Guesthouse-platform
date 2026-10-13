import { Guesthouse, routes, Stats, useApi } from '../api';
import { fmtP, State } from '../ui';

/** Fallback: derive what we can from the public guesthouse list when /admin/dashboard is missing. */
function derive(g: Guesthouse[]): Stats {
  const by = new Map<string, number>(); g.forEach(x => by.set(x.city, (by.get(x.city) ?? 0) + 1));
  const top = [...by].sort((a, b) => b[1] - a[1])[0]; const rated = g.filter(x => x.avgRating);
  const best = [...rated].sort((a, b) => b.avgRating! - a.avgRating!)[0];
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  return { totalGuesthouses: g.length, topCity: top ? { city: top[0], count: top[1] } : null,
    topRated: best ? { name: best.name, rating: best.avgRating! } : null,
    avgRating: rated.length ? sum(rated.map(x => x.avgRating!)) / rated.length : 0, avgPrice: g.length ? sum(g.map(x => x.pricePerNight)) / g.length : 0,
    verified: g.filter(x => x.verificationStatus === 'verified').length, unverified: g.filter(x => x.verificationStatus !== 'verified').length };
}

export default function Dashboard() {
  const api = useApi<Stats>(routes.dashboard); const list = useApi<Guesthouse[]>(routes.guesthouses);
  const missing = api.error?.status === 404;
  const s = api.data ?? (missing && list.data ? derive(list.data) : undefined);
  const loading = api.loading || (missing && list.loading); const error = missing ? list.error : api.error;
  const dash = (n?: number) => n ?? '—';
  const cards: [string, string | number, string?][] = s ? [
    ['Total guesthouses', s.totalGuesthouses], ['Top city', s.topCity?.city ?? '—', s.topCity ? `${s.topCity.count} guesthouses` : ''],
    ['Top-rated', s.topRated?.name ?? '—', s.topRated ? `${s.topRated.rating.toFixed(1)} rating` : ''],
    ['Customers', dash(s.totalCustomers)], ['Ratings', dash(s.totalRatings)], ['Favourites', dash(s.totalFavourites)],
    ['Most favourited', s.mostFavourited?.name ?? '—', s.mostFavourited ? `${s.mostFavourited.count} saves` : ''],
    ['Most reviewed', s.mostReviewed?.name ?? '—', s.mostReviewed ? `${s.mostReviewed.count} reviews` : ''],
    ['Average rating', s.avgRating.toFixed(2)], ['Average price / night', fmtP(s.avgPrice)],
    ['Verified', s.verified, `${s.unverified} not yet verified`],
  ] : [];
  return (<><h1>Dashboard</h1><p className="muted">Platform overview</p>
    {missing && s && <p className="muted">Showing figures worked out from the guesthouse list. Customer, rating and favourite totals need a dashboard endpoint.</p>}
    <State loading={loading} error={error} retry={() => { api.reload(); list.reload(); }}>
      <div className="grid">{cards.map(([t, v, sub]) => <div className="card stat" key={t}><span className="muted">{t}</span><b>{v}</b>{sub && <small className="muted">{sub}</small>}</div>)}</div>
    </State></>);
}
