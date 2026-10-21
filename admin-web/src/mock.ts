import { AdminUser, ApiError, Guesthouse, Notice, Review } from './api';

/** Demo mode (VITE_MOCK=true): an in-memory fake API so every page works without the backend. Resets on refresh. */
const gh = (id: string, name: string, city: string, price: number, rating: number, n: number,
  status: Guesthouse['verificationStatus'], lat: number, lng: number): Guesthouse => ({
  _id: id, name, logo: '', gallery: [], description: `${name} is a quiet guesthouse in ${city} with friendly hosts.`,
  amenities: ['Wi-Fi', 'Breakfast', 'Parking'], pricePerNight: price, city, country: 'Botswana',
  location: { latitude: lat, longitude: lng }, contact: { phone: '+267 71 000 000', email: 'host@example.com' },
  verificationStatus: status, isActive: true, averageRating: rating, ratingsCount: n, favouritesCount: Math.round(n / 3) });

// Sample guesthouses held in memory; changes disappear on refresh.
let houses: Guesthouse[] = [
  gh('g1', 'Thamalakane River Haven', 'Maun', 1250, 4.9, 128, 'verified', -19.9833, 23.4167),
  gh('g2', 'Kubu Island Eco Retreat', 'Gaborone', 950, 4.6, 74, 'verified', -24.6282, 25.9231),
  gh('g3', 'Kalahari Rest Lodge', 'Kasane', 1400, 4.7, 52, 'pending', -17.8, 25.15),
  gh('g4', 'Delta Reed Camp', 'Maun', 780, 4.4, 31, 'verified', -19.99, 23.42),
  gh('g5', 'Boteti Sunset Lodge', 'Maun', 1100, 4.6, 45, 'rejected', -20.0, 23.5),
];
const rv = (id: string, g: number, who: string, rating: number, comment: string, reported?: string): Review =>
  ({ _id: id, guesthouseId: { _id: houses[g]._id, name: houses[g].name }, customerId: { name: who }, rating, comment,
    createdAt: new Date(Date.now() - Number(id.slice(1)) * 864e5).toISOString(), reported: !!reported, reportReason: reported });
let reviews: Review[] = [
  rv('r1', 0, 'Neo M.', 5, 'Peaceful spot right on the river. Breakfast was lovely.'),
  rv('r2', 1, 'Lerato K.', 4, 'Clean rooms and helpful host. Wi-Fi was a bit slow.'),
  rv('r3', 2, 'Tumi S.', 1, 'Terrible place, do not book! Visit my site for better deals.', 'Spam or advertising'),
  rv('r4', 3, 'Kabo T.', 5, 'Great value for the price.'),
  rv('r5', 0, 'Mpho D.', 2, 'The host was rude to me and my family.', 'Offensive language'),
];
let admins: AdminUser[] = [
  { _id: 'a1', name: 'Admin One', email: 'admin@example.com', createdAt: new Date().toISOString() },
  { _id: 'a2', name: 'Admin Two', email: 'admin2@example.com', createdAt: new Date().toISOString() },
];
const notices: Notice[] = [
  { _id: 'n1', message: 'New 5-star rating for Thamalakane River Haven', createdAt: new Date().toISOString() },
  { _id: 'n2', message: 'New customer signed up', createdAt: new Date(Date.now() - 864e5).toISOString() },
  { _id: 'n3', message: 'Guesthouse added: Kalahari Rest Lodge', createdAt: new Date(Date.now() - 2 * 864e5).toISOString() },
];

// Builds the dashboard numbers from the sample data.
function stats() {
  const a = houses.filter(h => h.isActive); const by = new Map<string, number>();
  a.forEach(h => by.set(h.city, (by.get(h.city) ?? 0) + 1));
  const top = [...by].sort((x, y) => y[1] - x[1])[0]; const best = [...a].sort((x, y) => y.averageRating! - x.averageRating!)[0];
  const rated = [...a].sort((x, y) => y.ratingsCount! - x.ratingsCount!)[0];
  return { totalGuesthouses: a.length, topCity: top ? { city: top[0], count: top[1] } : null,
    topRated: best ? { name: best.name, rating: best.averageRating! } : null, totalCustomers: 42, totalRatings: reviews.length + 325,
    totalFavourites: 96, mostFavourited: { name: houses[0].name, count: 31 }, mostReviewed: rated ? { name: rated.name, count: rated.ratingsCount! } : null,
    avgRating: a.reduce((s, h) => s + h.averageRating!, 0) / (a.length || 1), avgPrice: a.reduce((s, h) => s + h.pricePerNight, 0) / (a.length || 1),
    verified: a.filter(h => h.verificationStatus === 'verified').length, unverified: a.filter(h => h.verificationStatus !== 'verified').length };
}

// Pretends to be the server: matches the path and method like the real routes.
export async function mockApi<T>(path: string, o: { method?: string; body?: unknown } = {}): Promise<T> {
  await new Promise(r => setTimeout(r, 250));
  const m = o.method ?? 'GET'; const b = (o.body ?? {}) as Record<string, any>;
  const out = (v: unknown) => JSON.parse(JSON.stringify(v)) as T; let x: RegExpMatchArray | null;
  if (path === '/auth/login') return out({ token: 'demo-token', user: { role: 'admin' } });
  if (path === '/admin/dashboard') return out(stats());
  if (path.startsWith('/guesthouses/search')) { const a = houses.filter(h => h.isActive); return out({ guesthouses: a, total: a.length, page: 1, limit: 100 }); }
  if (path === '/guesthouses' && m === 'GET') return out(houses.filter(h => h.isActive));
  if (path === '/guesthouses' && m === 'POST') {
    const h = { ...(b as object), _id: 'g' + Date.now(), verificationStatus: 'pending', isActive: true, averageRating: 0, ratingsCount: 0, favouritesCount: 0 } as Guesthouse;
    houses = [h, ...houses]; return out(h);
  }
  if ((x = path.match(/^\/guesthouses\/(\w+)$/))) {
    const h = houses.find(g => g._id === x![1]); if (!h) throw new ApiError(404, 'Guesthouse not found.');
    if (m === 'GET') return out(h);
    if (m === 'PUT') { Object.assign(h, b); return out(h); }
    if (m === 'DELETE') { h.isActive = false; return out({}); }
  }
  if (path === '/admin/reviews') return out(reviews);
  if (path === '/admin/reviews/reported') return out(reviews.filter(r => r.reported));
  if ((x = path.match(/^\/admin\/reviews\/(\w+)(\/dismiss-report)?$/))) {
    if (x[2]) reviews = reviews.map(r => (r._id === x![1] ? { ...r, reported: false, reportReason: undefined } : r));
    else reviews = reviews.filter(r => r._id !== x![1]);
    return out({});
  }
  if (path === '/admin/users' && m === 'GET') return out(admins);
  if (path === '/admin/users' && m === 'POST') {
    if (admins.some(a => a.email === b.email)) throw new ApiError(409, 'That email is already in use.');
    admins = [...admins, { _id: 'a' + Date.now(), name: b.name, email: b.email, createdAt: new Date().toISOString() }]; return out({});
  }
  if (path === '/admin/notifications') return out(notices);
  throw new ApiError(404, 'Route not found.');
}
