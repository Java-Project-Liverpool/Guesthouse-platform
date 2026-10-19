import { Guesthouse, routes, Stats, useApi, useGuesthouses } from '../api';
import { fmtP, State } from '../ui';

/** Worked out from the guesthouse search results (they include rating and favourite counts). */
function derive(g: Guesthouse[]): Stats {
  const by = new Map<string, number>(); g.forEach(x => by.set(x.city, (by.get(x.city) ?? 0) + 1));
  const top = [...by].sort((a, b) => b[1] - a[1])[0];
  const rated = g.filter(x => (x.ratingsCount ?? 0) > 0);
  const best = [...rated].sort((a, b) => b.averageRating! - a.averageRating!)[0];
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const most = (k: 'ratingsCount' | 'favouritesCount') => {
    const b = [...g].sort((x, y) => (y[k] ?? 0) - (x[k] ?? 0))[0];
    return b && (b[k] ?? 0) > 0 ? { name: b.name, count: b[k]! } : null;
  };
  return { totalGuesthouses: g.length, topCity: top ? { city: top[0], count: top[1] } : null,
    topRated: best ? { name: best.name, rating: best.averageRating! } : null,
    totalRatings: sum(g.map(x => x.ratingsCount ?? 0)), totalFavourites: sum(g.map(x => x.favouritesCount ?? 0)),
    mostFavourited: most('favouritesCount'), mostReviewed: most('ratingsCount'),
    avgRating: rated.length ? sum(rated.map(x => x.averageRating!)) / rated.length : 0,
    avgPrice: g.length ? sum(g.map(x => x.pricePerNight)) / g.length : 0,
    verified: g.filter(x => x.verificationStatus === 'verified').length, unverified: g.filter(x => x.verificationStatus !== 'verified').length };
}

// Overview page. Uses /admin/dashboard if it exists, otherwise works the figures out from the guesthouse search.
export default function Dashboard() {
  const api = useApi<Stats>(routes.dashboard); const list = useGuesthouses();
  // A 404 means the backend has no dashboard endpoint yet.
  const missing = api.error?.status === 404;
  const s = api.data ?? (missing && list.data ? derive(list.data) : undefined);
  const loading = api.loading || (missing && list.loading); const error = missing ? list.error : api.error;
  const dash = (n?: number) => n ?? '—';
  // One entry per card: title, main value, optional small note.
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
    {missing && s && <p className="muted">Figures come from the guesthouse search. Customer totals need a dashboard endpoint.</p>}
    <State loading={loading} error={error} retry={() => { api.reload(); list.reload(); }}>
      <div className="grid">{cards.map(([t, v, sub]) => <div className="card stat" key={t}><span className="muted">{t}</span><b>{v}</b>{sub && <small className="muted">{sub}</small>}</div>)}</div>
    </State></>);
}
