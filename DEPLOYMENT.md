# Sangam Deployment Guide

This document outlines how to safely deploy the Sangam application to a production environment.

## Infrastructure Requirements
- **Node.js**: v18+
- **Database**: PostgreSQL (SQLite is ONLY for local development)
- **Frontend Hosting**: Vercel, Netlify, or Nginx
- **Backend Hosting**: Render, Railway, Fly.io, or any Node.js VPS

---

## 1. Environment Variables

Before deploying the backend, ensure the following environment variables are securely set in your hosting provider's dashboard:

### Required
- `DATABASE_URL`: Your production PostgreSQL connection string (e.g. `postgresql://user:password@host:5432/dbname`). **Note:** Setting this automatically switches the backend from SQLite to PostgreSQL.
- `JWT_SECRET`: A long, cryptographically secure random string (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- `CORS_ORIGINS`: Your production frontend URL (e.g. `https://sangam.example.com`).
- `NODE_ENV`: `production`
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID — **required in production**; Google sign-in fails closed without it.

### Optional
- `JWT_EXPIRE_MINUTES`: Access-token lifetime in minutes (defaults to `60`; sessions renew silently via the refresh cookie).
- `DATABASE_SSL`: Set to `false` if your Postgres provider doesn't require SSL (defaults to `true`).
- `DATABASE_SSL_CA`: CA certificate (PEM contents or file path) for providers with custom CAs.
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: Set to `false` only for self-signed setups (certificate validation is ON by default).
- `DATABASE_POOL_MAX`: Set maximum database connections (defaults to `5`).
- `BREVO_API_KEY` / `RESEND_API_KEY` / `EMAIL_FROM` / `SMTP_*`: Email providers (Brevo → Resend → SMTP fallback chain).

---

## 2. Database Migrations

You must run the Sequelize migrations against your production PostgreSQL database before starting the application:

```bash
cd apps/backend
npm run migrate
```
*Note: Some platforms like Render allow you to set this as a "Build Command" (e.g. `npm install && npm run migrate`). `render.yaml` in the repo root is already configured with `rootDir: apps/backend`.*

The production server does **not** run `sequelize.sync()` — migrations are the single source of schema truth.

---

## 3. Deployment Steps

### Backend
1. Clone repository to your server/hosting platform.
2. Run `npm install` inside the `apps/backend` directory.
3. Provide the environment variables.
4. Run `npm run migrate`.
5. Start the server using `npm start` (or a process manager like PM2: `pm2 start src/server.js`). The server listens only after migrations succeed.

### Frontend
1. Set `VITE_API_URL` (deployed backend URL) and `VITE_GOOGLE_CLIENT_ID` in the hosting provider's environment variables.
2. Run `npm install` inside the `apps/frontend` directory.
3. Run `npm run build`.
4. Serve the contents of `apps/frontend/dist` using your preferred static web server (Vercel, Netlify, Nginx).
