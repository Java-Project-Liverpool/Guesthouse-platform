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
│   ├── routes/authRoutes.ts
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

Set `MONGODB_URI` in `.env` to your MongoDB connection string. Start the
development server with:

```bash
npm run dev
```

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

## Ratings and reviews

`src/models/Rating.ts` maps to the `ratings` collection and stores `guesthouseId`,
`customerId`, an integer rating from 1 to 5, an optional comment, and timestamps.
Validation checks that the referenced guesthouse exists and the referenced user
has the customer role. A unique compound index on `(customerId, guesthouseId)`
prevents a customer from rating the same guesthouse more than once.
