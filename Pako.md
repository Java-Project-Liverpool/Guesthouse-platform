# Pako-S Project Task Record

This document records the guesthouse project work completed with Pako on the `Pako-S` branch and summarizes how each task was approached. It covers the work visible in the repository history and the project tasks discussed during our sessions.

## Backend user and authentication work

### User model

- Created a Mongoose user schema for customer and admin accounts.
- Added name, normalized unique email, password, role, authentication provider, optional Google ID, and timestamps.
- Validated account fields and role/provider values. Local passwords are hashed with bcrypt before saving, and password hashes are excluded from normal query results and JSON responses.
- Added password comparison for login.

### Customer registration — issue #6

- Added `POST /api/auth/register`.
- Validated the request body, normalized the email, and returned a conflict response for duplicate addresses.
- Public registration always creates a customer with local authentication; callers cannot set their own role or provider.
- Relied on the User model to validate and hash the password, and returned a safe user representation without the hash.

### Login and JWT authentication — issue #15

- Implemented `POST /api/auth/login` to validate credentials and return a signed JWT with the user’s identity and role.
- Added bearer-token middleware that verifies the signature, expiry, algorithm, subject, and supported role.
- Added role guards for admin and customer routes, plus an authenticated `/api/auth/me` endpoint.
- Used a shared JWT secret configuration read from the environment.

### Authentication and role middleware — issue #16

- Applied authentication and role checks to protected backend routes.
- Requests with absent, invalid, or expired tokens are rejected; authenticated users without the required role receive a forbidden response.

### Admin account creation — issue #17

- Added `POST /api/admin/users` for an authenticated admin to create another admin account.
- Restricted accepted fields to name, email, and password, then assigned the admin role and local provider on the server.
- Reused User model validation and password hashing, normalized email addresses, and handled duplicate-email conflicts, including unique-index race conditions.

## Guesthouse and review features

### Ratings and reviews model — issue #8

- Added a Mongoose rating model with guesthouse and customer references, a whole-number rating from 1 to 5, an optional written comment, and timestamps.
- Validated that the referenced guesthouse exists and the author is a customer.
- Added a unique compound index so one customer can rate a guesthouse only once.

### Guesthouse CRUD API — issue #20

- Implemented endpoints to list and retrieve active guesthouses and to create, update, and deactivate listings.
- Protected listing changes with the admin role; browsing remains public.
- Allowed only the intended writable fields, validated IDs and request data, and returned clear JSON errors for invalid input or missing listings.
- Used deactivation for deletion so a listing can be hidden without physically removing its record.

### Guesthouse search, filters, and sorting

- Added search parameters for guesthouse name, city, amenities, price range, minimum rating, verification, sorting, and pagination.
- Validated numeric query values and limited page size before passing the request to the guesthouse search service.

## CI and project maintenance

### GitHub Actions CI

- Added `.github/workflows/ci.yml` with independent Admin Web, Backend, and Mobile App jobs.
- Configured Node.js 24, npm caching based on each project's lockfile, and reproducible `npm ci` installs.
- Ran the existing project checks: admin lint and build, backend build, and mobile lint. No deployment or mobile package build was added.

### Backend deployment-readiness review

- Reviewed the backend against the pre-deployment checklist, including its build/start scripts, port and host binding, health endpoint, environment-based secrets, CORS, and error responses.
- Updated the server setup for the health-check paths and network binding, and documented the backend setup in `backend/README.md`.
- This was a readiness review only: no hosting service, Atlas database, production environment variables, or deployment was configured as part of that task.

### Merge conflict resolution

- Resolved conflicts in `backend/package.json` and `backend/package-lock.json` by preserving the required backend dependencies and development type packages in valid JSON/lockfile state.
- Kept the lockfile consistent with the package manifest and validated the backend build before pushing.

### Code comments

- Added short comments to the admin route and server setup to explain the access checks, allowed account fields, password handling, duplicate-email protection, health endpoints, error responses, and host binding.
- Kept these changes explanatory; they did not alter application behavior. The backend build passed afterward.

## Branch and pull request workflow

- Before beginning repository tasks, checked the current branch and working tree and fetched the latest `Pako-S` and `main` references.
- Preserved unrelated untracked project documents and local files when staging changes.
- Pushed completed implementation commits to `Pako-S` when the task requested a push, without force-pushing or rewriting history.
- After reviewing the branch relationship, fast-forwarded local `Pako-S` to the latest merged `main` commit before preparing this record.

## Validation and scope

- Used the existing TypeScript build and CI scripts to check the relevant changes; when a task requested tests, ran the applicable checks and investigated failures instead of suppressing them.
- Kept changes within the backend, workflow, and documentation scope of the requested tasks.
- Did not deploy the application as part of these tasks.
