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
- `JWT_SECRET`: A long, cryptographically secure random string.
- `CORS_ORIGINS`: Your production frontend URL (e.g. `https://sangam.example.com`).
- `NODE_ENV`: `production`

### Optional
- `DATABASE_SSL`: Set to `false` if your Postgres provider doesn't require SSL (defaults to `true`).
- `DATABASE_POOL_MAX`: Set maximum database connections (defaults to `5`).

---

## 2. Database Migrations

You must run the Sequelize migrations against your production PostgreSQL database before starting the application:

```bash
cd backend
npm run migrate
```
*Note: Some platforms like Render allow you to set this as a "Build Command" (e.g. `npm install && npm run migrate`).*

---

## 3. Deployment Steps

### Backend
1. Clone repository to your server/hosting platform.
2. Run `npm install` inside the `/backend` directory.
3. Provide the environment variables.
4. Run `npm run migrate`.
5. Start the server using `npm start` (or a process manager like PM2: `pm2 start src/server.js`).

### Frontend
1. Change `src/api.js` base URL to point to your deployed backend URL.
2. Run `npm install` inside the `/frontend` directory.
3. Run `npm run build`.
4. Serve the contents of the `/frontend/dist` directory using your preferred static web server (Vercel, Netlify, Nginx).
