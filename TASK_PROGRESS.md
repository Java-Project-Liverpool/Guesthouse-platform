# TASK_PROGRESS.md — Dumela Stays admin-web development

## Goal
Build landing page (milestone 1) and login page (milestone 2) for admin-web (`admin-web/`) based on `Dumela_Stays_Designs.pdf` and zip design files (`03 — Discover Home.jpg` etc.). Connect to existing backend (`/api/auth/login`).

## Acceptance Criteria
- Milestone 1: Landing page exists in `admin-web/src/App.tsx`; reflects `03 — Discover Home` design (search, featured stays, locations, login link). Build passes.
- Milestone 2: Login page exists (`admin-web/src/Login.tsx`); connects to `POST /api/auth/login`; handles errors. Build passes.
- Changes stay within `admin-web/`; no unrelated backend/mobile changes.
- All checks (`npm run build`, `npm run lint`) pass before claiming milestone complete.

## Milestones
- Milestone 1: Design review + landing page — IN PROGRESS/COMPLETED
- Milestone 2: Login page + backend connection — IN PROGRESS (file created, needs verification)
- Remaining: None planned until user confirms milestone 2 scope

## Completed Milestones
- Read design files (`Dumela_Stays_Designs.pdf`, zip with `03 — Discover Home.jpg`, etc.). Extracted text confirms: "Dumela", "Welcome back", search by name/location, featured stays, price listings, locations (Maun, Gaborone, Kasane), sorting.
- Confirmed admin-web structure (`App.tsx` starter replaced with landing page)
- Milestone 1 implemented and verified: `App.tsx` updated; `npm run build` passed (1.87s)
- Milestone 2 implemented (file created): `Login.tsx` created with `fetch('http://localhost:5000/api/auth/login')` connection; build passes

## Remaining Work
- Milestone 2 final verification: test login against running backend (requires server start)
- User confirmation that design matches expectations (PDF not fully readable; design inferred from `.jpg` filenames and text extraction)

## Files Changed
- `admin-web/src/App.tsx` — landing page (replaced starter)
- `admin-web/src/Login.tsx` — login page (new)
- `TASK_PROGRESS.md` — updated

## Verification Results
- Design text verified: `Dumela_Stays_Designs.pdf` → text shows hero/home page content.
- `admin-web/src/App.tsx` builds successfully (`npm run build` passes).
- `admin-web/src/Login.tsx` builds successfully (no TypeScript errors).
- Backend `POST /api/auth/login` endpoint exists (`backend/src/routes/authRoutes.ts` line 80).

## Blockers
- PDF pixel-level details not fully readable; design approximated from filenames and text extraction.

## Next Action
- Confirm milestone 2 passes (start backend server, test login endpoint from admin-web, or verify with user) before declaring complete.

---
*Updated: Wed Oct 14 2026*

--- Stage 7 (Sun Oct 18 2026) ---
Admin account created and verified via backend login (token + role=admin). Frontend build passes. Carousel + hero + animation updates complete in admin-web/src/pages/Landing.tsx and index.css. No unrelated files modified.

