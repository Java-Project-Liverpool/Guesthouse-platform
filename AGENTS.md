# Session startup

At the start of each work session in this repository, check the current branch and working tree, fetch `origin/Pako-S`, and fast-forward the local `Pako-S` branch to `origin/Pako-S` when possible. Preserve uncommitted and untracked user files. If the branch has diverged or updating would conflict with local work, do not reset or discard anything; report the state and ask how to proceed. Also make sure the current branch is in line with the main branch if not make sure to update the branch before starting to work.

## Repository structure

This is a three-part guesthouse discovery platform. Work on each part independently.

- `backend/` — Express + TypeScript + MongoDB API. Entry: `backend/src/server.ts`. Build: `cd backend && npm run build`. Run: `npm run dev` (ts-node-dev) or `npm start` (node dist/server.js).
- `admin-web/` — React + Vite admin dashboard. Build: `cd admin-web && npm run build`. Lint: `npm run lint`.
- `mobile-app/` — Expo/React Native mobile client. Run: `npm start` (expo start). Lint: `npm run lint`.

## Backend conventions

- All routes are mounted under `/api/` in `src/server.ts`: `/api/auth`, `/api/guesthouses`, `/api/favourites`, `/api/admin`, plus `/api/search-history`, `/api/favourite-collections`, `/api/comparison` (added on `main`).
- Auth middleware (`src/middleware/authMiddleware.ts`): `authenticate` sets `req.authenticatedUser`; `requireAdmin`/`requireCustomer` enforce roles.
- JWT secret is read at runtime from `process.env.JWT_SECRET` (min 32 bytes). Never commit `.env`.
- Health check: `GET /health` returns `200` when MongoDB is connected, `503` otherwise.
- CORS origins are configurable via `CORS_ORIGIN` env var (comma-separated).
- `delete` on guesthouses deactivates (`isActive: false`), it does not physically remove the record.
- Ratings are stored in a separate collection; the search service calculates `averageRating` and `ratingsCount` via MongoDB aggregation pipeline.
- Favourites are tracked in `Favourite` (one per customer+guesthouse) and `FavouriteCollection` (named collections with multiple guesthouse IDs).

## Mobile app conventions

- Expo v57.0.0. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
- Login page exists at `mobile-app/src/app/login.tsx` (phone/email tabs, password toggle).
- Web variants use `.web.tsx` suffixes (e.g., `app-tabs.web.tsx`, `animated-icon.web.tsx`).
- Shared theme constants live in `mobile-app/src/constants/theme.ts`.

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`, `develop`, `Pako-S`. Three independent jobs:
- `admin-web`: `npm ci` → `npm run lint` → `npm run build`
- `backend`: `npm ci` → `npm run build`
- `mobile-app`: `npm ci` → `npm run lint`

Node.js 24 is required. No tests are currently configured; CI only checks lint and build.

## Branch workflow

- Work on the `Pako-S` branch.
- Before starting, fetch `origin/Pako-S` and fast-forward if possible. Preserve uncommitted files.
- After completing work, push to `Pako-S` and open a pull request against `main`.
- The `Pako-S` branch should stay in sync with `main`; merge `origin/main` into `Pako-S` before starting new work.