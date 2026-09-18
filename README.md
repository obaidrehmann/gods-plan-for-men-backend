# Gods Plan for Men — Backend

Node.js + TypeScript + MongoDB API for the Gods Plan for Men mobile app and dashboard.

## Stack

- Express
- TypeScript
- MongoDB (Mongoose)
- JWT auth
- Zod validation

## Project structure

```
src/
  config/         # env + database
  controllers/    # HTTP handlers
  middleware/     # auth, validation, errors
  models/         # Mongoose models
  routes/         # API routes
  services/       # business logic
  types/          # shared TypeScript types
  utils/          # helpers
  validators/     # Zod schemas
  app.ts          # Express app
  server.ts       # entry point
```

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Update `.env` with your MongoDB URI and a strong `JWT_SECRET`.

3. Install and run:

```bash
npm install
npm run dev
```

API base URL: `http://localhost:3000/api/v1`

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start with hot reload    |
| `npm run build`| Compile TypeScript       |
| `npm start`    | Run production build     |
| `npm run lint` | Type-check without emit  |

## Endpoints

### Health
- `GET /api/v1/health`

### Auth
- `POST /api/v1/auth/register` — `{ name, email, password }`
- `POST /api/v1/auth/login` — `{ email, password }`
- `GET /api/v1/auth/me` — Bearer token required
- `PATCH /api/v1/auth/me` — update profile fields
- `POST /api/v1/auth/me/avatar` — multipart avatar upload
- `PATCH /api/v1/auth/me/password` — `{ currentPassword, newPassword }`
- `PATCH /api/v1/auth/me/security` — `{ loginAlertsEnabled }`

### Books
- `GET /api/v1/books` — published books
- `GET /api/v1/books/:id`
- `GET /api/v1/books/all` — admin
- `POST /api/v1/books` — admin
- `PATCH /api/v1/books/:id` — admin
- `DELETE /api/v1/books/:id` — admin
