# Campus Log

A campus project/collaboration platform. React + Vite frontend, Express + Sequelize backend.

- `frontend/` — React (Vite, Tailwind)
- `backend/` — Express, Sequelize ORM, JWT auth, Google Identity Services sign-in

Locally the backend runs on SQLite with zero setup. In production it runs on Postgres.

---

## Requirements

- Node.js 20+ (tested on Node 22)
- No local database install needed for development (SQLite file, auto-created)
- A Google Cloud project with an OAuth 2.0 Client ID, if you want "Continue with Google" to work

---

## Local setup

**Backend**

```bash
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:8000
npm run seed        # optional: demo data
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

---

## Environment variables

### backend/.env

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no | defaults to 8000 |
| `NODE_ENV` | prod | set to `production` in production |
| `JWT_SECRET` | yes | random long string; never reuse the example value |
| `JWT_EXPIRE_MINUTES` | no | defaults to 10080 (7 days) |
| `DATABASE_URL` | prod | Postgres connection string. Unset locally → SQLite is used instead |
| `DATABASE_STORAGE` | no | SQLite file path, dev only |
| `DATABASE_SSL` | no | defaults to true; set `false` only if your Postgres host doesn't use SSL |
| `CORS_ORIGINS` | yes | comma-separated list of allowed frontend origins |
| `GOOGLE_CLIENT_ID` | for Google sign-in | OAuth 2.0 Web Client ID from Google Cloud Console |

### frontend/.env

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes | backend's public URL — must be `https://…` in production, never `localhost` |
| `VITE_GOOGLE_CLIENT_ID` | for Google sign-in | same Client ID as backend's `GOOGLE_CLIENT_ID` |

---

## Database setup

Schema is managed with Sequelize migrations (`backend/src/migrations`), not manual table creation.

```bash
cd backend
npm run migrate          # apply all pending migrations
npm run migrate:status   # see what's applied
npm run migrate:undo     # roll back the last migration
```

Locally (no `DATABASE_URL` set), the server auto-syncs the SQLite schema on boot, so `npm run migrate` isn't required for local dev — it exists for Postgres/production, where the schema is only ever changed through migrations, never auto-synced.

---

## Production deployment (Neon + Render + Vercel)

I picked this combination because it fits the existing stack directly: Neon is serverless Postgres with no server to manage, Render runs the Express API as a persistent Node service (matches `PORT`/`app.listen` already in `server.js`), and Vercel is the standard host for a Vite/React SPA with the rewrite in `frontend/vercel.json` already in place for client-side routing.

**I don't have access to your Neon, Render, Vercel, or Google Cloud accounts, so I can't actually click through and provision these — the code, migrations, and config files are ready, but the steps below are yours to run.**

### STEP 1 — Create the production database (Neon)
1. Go to https://neon.tech → sign up/log in → **New Project**.
2. Name it (e.g. `campus-log`), pick a region close to your users, create it.
3. On the project dashboard, copy the **connection string** (starts `postgresql://`). Use the "pooled connection" string if offered.

### STEP 2 — Configure the database URL
1. You'll paste this as `DATABASE_URL` into Render's environment variables in Step 5 — no need to put it in a committed file.

### STEP 3 — Run migrations
This happens automatically as part of Render's build (`render.yaml` sets `buildCommand: npm install && npm run migrate`). You can also run it manually from your machine against the Neon URL:
```bash
cd backend
DATABASE_URL="<your neon connection string>" npm run migrate
```

### STEP 4 — Deploy the backend (Render)
1. Push this repo to GitHub if it isn't already.
2. Go to https://render.com → **New** → **Blueprint** → connect the repo. Render will read `render.yaml` at the repo root and detect the `campus-log-api` service (root directory `Campus-log/backend`).
   - If you'd rather not use the blueprint: **New → Web Service**, root directory `Campus-log/backend`, build command `npm install && npm run migrate`, start command `npm start`.

### STEP 5 — Configure backend environment variables
In the Render service → **Environment**, set:
- `NODE_ENV=production`
- `JWT_SECRET=<generate a long random string>`
- `DATABASE_URL=<your Neon connection string from Step 1>`
- `CORS_ORIGINS=<your Vercel frontend URL, added after Step 8>`
- `GOOGLE_CLIENT_ID=<from Step 9>`

### STEP 6 — Get the backend production URL
After the first deploy succeeds, Render shows a URL like `https://campus-log-api.onrender.com`. Copy it.

### STEP 7 — Configure the frontend API URL
In Vercel (next step) set the environment variable `VITE_API_URL=https://campus-log-api.onrender.com` (your real Render URL from Step 6).

### STEP 8 — Deploy the frontend (Vercel)
1. Go to https://vercel.com → **New Project** → import the same repo.
2. Set **Root Directory** to `Campus-log/frontend`.
3. Framework preset: Vite (auto-detected).
4. Add environment variables: `VITE_API_URL` (Step 7) and `VITE_GOOGLE_CLIENT_ID` (Step 9).
5. Deploy. Copy the resulting URL, e.g. `https://campus-log.vercel.app`.
6. Go back to Render (Step 5) and set `CORS_ORIGINS` to this exact URL, then redeploy the backend.

### STEP 9 — Configure Google OAuth
This app uses **Google Identity Services** (a client-side sign-in button returning a signed ID token that the backend verifies) — not a server redirect flow — so you only need an **authorized JavaScript origin**, not a callback/redirect URI.
1. https://console.cloud.google.com/apis/credentials → select/create a project.
2. **Create Credentials → OAuth client ID → Web application.**
3. Under **Authorized JavaScript origins**, add both:
   - `http://localhost:5173` (dev)
   - `https://campus-log.vercel.app` (your real Vercel URL from Step 8)
4. Save, copy the **Client ID**.
5. Set it as `GOOGLE_CLIENT_ID` in Render (Step 5) and `VITE_GOOGLE_CLIENT_ID` in Vercel (Step 8), then redeploy both.

### STEP 10 — Configure CORS
Already done in Step 5/8 — `CORS_ORIGINS` on the backend must exactly match the Vercel frontend origin (no trailing slash).

### STEP 11 — Test authentication
Visit your Vercel URL → sign up with a campus email → log out → log back in → try "Continue with Google".

### STEP 12 — Test projects
Create a project, confirm it appears in Explore/search.

### STEP 13 — Test applications
Apply to a project from a second account, confirm the owner sees the application.

### STEP 14 — Test connections
Send a connection request between two accounts, accept it.

### STEP 15 — Test notifications
Confirm the notification bell updates after an application/connection event without a full page reload.

### STEP 16 — Final verification
Hit `https://campus-log-api.onrender.com/api/health` — expect `{"status":"ok","database":"connected"}`.

---

## Notes on what's already handled in code

- **CORS** — configured from `CORS_ORIGINS`, credentials-aware, no wildcard origin (`backend/src/server.js`).
- **Port binding** — reads `process.env.PORT`, never hardcoded.
- **Error responses** — 5xx errors return a generic message to the client; full detail is logged server-side only (`backend/src/middleware/errorHandler.js`).
- **Health check** — `GET /api/health` reports DB connectivity.
- **One email = one account** — `users.email` has a unique constraint at the database level, enforced in both migrations and the Sequelize model; Google sign-in links to an existing email/password account instead of creating a duplicate.
- **Passwords** — hashed with bcrypt, never stored or returned in plaintext.
- **Authorization** — routes that mutate a resource (projects, applications, connections) check `req.user.id` against ownership before allowing changes — review `backend/src/routes/` if you add new mutating endpoints, since this is the most common source of IDOR bugs (e.g. changing `projectId` in a request to touch someone else's data).
