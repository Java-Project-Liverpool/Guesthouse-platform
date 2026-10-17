# Guesthouse Platform Backend

## Technologies

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose

## Structure

```text
backend/
├── src/
│   ├── config/database.ts
│   ├── models/
│   │   ├── Guesthouse.ts
│   │   ├── Rating.ts
│   │   └── User.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   └── guesthouseRoutes.ts
│   ├── middleware/authMiddleware.ts
│   └── server.ts
├── .env.example
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Setup

From this directory, install dependencies and copy `.env.example` to `.env`:

```bash
npm install
cp .env.example .env
```

Set `MONGODB_URI` in `.env` to your MongoDB connection string and set
`JWT_SECRET` to a cryptographically random value of at least 32 bytes. Do not
commit the `.env` file. Set `CORS_ORIGIN` to a comma-separated list of allowed
web client origins; local development defaults to the Vite and Expo web origins.
Start the development server with:

```bash
npm run dev
```

## Render configuration

For a Render web service, set the root directory to `backend`, the build command
to `npm ci && npm run build`, and the start command to `npm start`. Configure
`MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` in the Render environment. Use
`/health` as the health check path. The endpoint returns `200` when MongoDB is
connected and `503` while it is unavailable.

## User model

`src/models/User.ts` defines customer and admin accounts in the shared user
collection. It follows the project data model with `name`, normalized unique
`email`, `passwordHash`, `role`, `authProvider`, optional `googleId`, and automatic
`createdAt` / `updatedAt` timestamps.

For local accounts, provide the plaintext password through the model's virtual
`password` field. The model hashes it with bcrypt before validation completes;
the hash is excluded from query results by default. Authentication code should
select it explicitly when checking a login attempt:

```ts
const user = await User.findOne({ email }).select("+passwordHash");
const valid = user ? await user.comparePassword(password) : false;
```

Google accounts can use `authProvider: "google"` and a unique `googleId` without
a local password. Roles are restricted to `customer` and `admin`, with new users
defaulting to `customer`.

## Customer registration

`POST /api/auth/register` accepts a JSON object containing `name`, `email`, and
`password`. It always creates a local customer account; public requests cannot
assign an admin role or choose an authentication provider. Successful requests
return `201` with the new user and never include its password hash. Invalid input
returns `400`, and an email already in use returns `409`.

## Login and route authorization

`POST /api/auth/login` accepts `email` and `password`. Successful logins return
a signed HS256 bearer token that expires after one hour and a safe user object.
Invalid credentials return `401` with a generic response. Send the token in the
`Authorization: Bearer <token>` header. `GET /api/auth/me` verifies the token
and returns its user ID and role; missing, invalid, and expired tokens are
rejected with `401`.

Route handlers can use the middleware in `src/middleware/authMiddleware.ts`:

```ts
router.get("/admin/resource", authenticate, requireAdmin, handler);
router.post("/customer/resource", authenticate, requireCustomer, handler);
```

`authenticate` verifies the token signature and expiry and sets
`req.authenticatedUser`. `requireAdmin` and `requireCustomer` require the
matching signed role and return `403` for an authenticated user with the wrong
role. The guards are reusable for the respective admin and customer routes.

An authenticated admin can create another local admin with
`POST /api/admin/users` and a JSON body containing `name`, `email`, and
`password`. The endpoint always assigns the admin role, hashes the password
through the User model, returns `409` for an existing email, and never returns
the password hash. Missing authentication returns `401`; a customer token
returns `403`.

## Ratings and reviews

`src/models/Rating.ts` maps to the `ratings` collection and stores `guesthouseId`,
`customerId`, an integer rating from 1 to 5, an optional comment, and timestamps.
Validation checks that the referenced guesthouse exists and the referenced user
has the customer role. A unique compound index on `(customerId, guesthouseId)`
prevents a customer from rating the same guesthouse more than once.

## Guesthouse API

Guesthouse routes are mounted at `/api/guesthouses`:

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/guesthouses` | Public; returns active listings |
| `GET` | `/api/guesthouses/:id` | Public; returns an active listing |
| `POST` | `/api/guesthouses` | Admin only |
| `PUT` | `/api/guesthouses/:id` | Admin only |
| `DELETE` | `/api/guesthouses/:id` | Admin only |

Create and update accept guesthouse fields from the model. The API always sets
`createdBy` from the authenticated admin and does not accept verification
metadata from request bodies. Model validation runs on create and update;
invalid input returns `400`, and missing listings return `404`. Delete
deactivates a listing (`isActive: false`) so existing ratings can continue to
reference it; inactive listings are omitted from public reads. An admin can
reactivate a listing by setting `isActive: true` in a `PUT` request.
