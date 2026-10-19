# Dumela Stays: Admin Web (React + TypeScript)
Setup: `npm install`, copy `.env.example` to `.env` (set `VITE_API_URL`), then `npm run dev`.
All endpoint paths are in `routes` in `src/api.ts`. Match them to the API team's docs. Expected: `POST /auth/login` returns `{token, user?}`;
`GET /admin/dashboard` returns the `Stats` shape in `api.ts`; guesthouses use REST at `/admin/guesthouses` (multipart on create/edit, `PATCH {verified}` to verify);
reviews at `/admin/reviews`, `/admin/reviews/reported`, `POST .../:id/dismiss-report`, `DELETE .../:id`; admins at `/admin/users`; notifications at `/admin/notifications` (optional).
No booking, reservation, payment or checkout code exists in this app.
