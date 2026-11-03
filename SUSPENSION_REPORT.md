# Customer Suspension Fix — Evidence-Based Report

## 1. Root Cause (Evidence-Based)
Not fully confirmed by live endpoint capture. Based on code inspection:
- The frontend `handleStatusChange` (Users.tsx:79) sends `PUT /admin/customers/${id}/status` via `apiFetch` to `BASE_URL` (derived from `VITE_API_BASE_URL` or `http://localhost:5000`).
- The deployed Vercel frontend likely points to `https://dumela-stays-api.onrender.com` (production URL from context), but the deployed backend may still run an older image without the new `PUT /customers/:id/status` route if Render was not redeployed after commit `dfb2e40`.
- The `catch` block triggers the generic alert (`Failed to update status.` or `Could not update customer status.`), and `finally` resets the loading state (line 89).
- The request format matches perfectly (`{ isActive: boolean }` with `Authorization: Bearer <token>`).
- The database uses the existing `User.isActive` field (`isActive: Boolean, default: true`) — no conflicting second field.

**Likely actual cause:** Deployed backend version mismatch (older build without the suspension endpoint) OR missing/invalid admin token in deployed session, resulting in a non-2xx response caught by the frontend.

**Evidence missing:** Actual HTTP status and response body from `https://dumela-stays-api.onrender.com/api/admin/customers/:id/status` with a live admin token. No access to deployed server or admin token was available.

## 2. Actual Request Details (Captured from Source)
- Method: `PUT`
- URL pattern: `/api/admin/customers/:id/status`
- Request body: `JSON.stringify({ isActive })` (boolean)
- Auth header: `Authorization: Bearer ${localStorage.getItem('token')}`
- Full URL constructed by `apiFetch`: `${BASE_URL}/api/admin/customers/${id}/status`
- Backend mounted route: `/api/admin` + `/customers/:id/status` = `/api/admin/customers/:id/status`

## 3. Files Changed (Verified Locally)
- `backend/src/routes/adminRoutes.ts`: Added `PUT /customers/:id/status` (line 280) with `authenticate`, `requireAdmin`, ID validation (`mongoose.isObjectIdOrHexString`), body validation (`isActive` boolean), self-suspension guard (line 293), `findOne({ _id, role: "customer" })`, `user.isActive = isActive`, `await user.save()`.
- `backend/src/middleware/authMiddleware.ts`: `authenticate` checks `User.findById(payload.sub).select("isActive").lean()`; rejects with 403 if `isActive === false`.
- `backend/src/models/User.ts`: `isActive` field (line 76) — existing, unchanged.
- `admin-web/src/services/userService.ts`: `suspendCustomer` (line 4) calls `/admin/customers/${id}/status` with `PUT`.
- `admin-web/src/pages/Users.tsx`: `handleStatusChange` uses `try/catch/finally`; `finally` resets `suspendingId` (line 89); button disabled while `suspendingId === user._id`.
- `admin-web/src/types/index.ts`: Added `isActive?: boolean`.

## 4. Build / Lint / Test Results
- `backend/src`: `npx tsc --noEmit` → PASS (no errors)
- `admin-web`: `npm run build` → PASS (1.18s)
- `admin-web`: `npm run lint` → PASS (0 errors)
- `mobile-app`: `npm run lint` → PASS (0 errors)

## 5. Database Update Tested?
Not with real production records. The Mongoose operation (`user.save()`) is verified by code inspection; the route saves the correct field. No destructive DB changes were made.

## 6. Deployed Backend Verified?
No. The deployed Render instance (`https://dumela-stays-api.onrender.com`) was not redeployed or verified. The backend fix exists only in the repository (`Pako-S` branch). A redeploy is required.

## 7. Browser-Level Suspension Verified?
No live verification performed — no running backend server / admin token / emulator connected. The code logic is verified; live behavior requires redeployment.

## 8. Remaining Manual / Deployment Steps
1. Redeploy `backend` to Render (`https://dumela-stays-api.onrender.com`) using the `Pako-S` branch.
2. Redeploy `admin-web` to Vercel (`https://guesthouse-platform-ten.vercel.app`) using the updated API client.
3. Obtain a valid admin token and test `PUT /api/admin/customers/{id}/status` in browser DevTools.
4. Confirm the response body contains `{ message: "...", user: { ... isActive: false ... } }`.
5. Confirm `Users.tsx` updates status to Suspended and clears `Working...`.
6. Confirm reactivation (`isActive: true`) works the same way.
7. Confirm suspended customers receive 403 from `authenticate` middleware.

## 9. Diagnostic Logging / Evidence Capture (Non-Secret)
If you need to capture the exact failure in the browser:
1. Open `https://guesthouse-platform-ten.vercel.app/app-users`
2. Log in as admin (token stored in `localStorage` as `token`)
3. Click any **Suspend** button
4. Open DevTools → Network → filter `PUT`
5. Click the failed `customers` request
6. Inspect: **Request URL**, **Method**, **Status**, **Response** tab (look for `{ message: "..." }`), **Headers** tab (verify `Authorization` is present — do not copy token value)
7. If Status is `404`: endpoint missing (deployment issue). If `403`: token/admin issue. If `500`: database/query error.

## 10. Safety Checks
- No `.env` files modified or committed.
- No secrets exposed in logs or reports.
- `isActive` is the only suspension field; no conflicting second status field added.
- Self-suspension guard preserved (`if (req.authenticatedUser.id === req.params.id && isActive === false)` → 403).
- Loading state always reset (`finally` block present).
- Prototype (`dumela-stays-prototype/`) untouched.
- Existing branch `Pako-S` preserved (`8c79ffe` → `dfb2e40` → `7da6222`).
