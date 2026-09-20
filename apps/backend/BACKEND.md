# Sangam Backend — Developer Reference

> Read CONTEXT.md at the repo root first for the full project overview. This file has backend-specific deep dives.

## Entry Point: src/server.js

The Express app middleware order (order matters!):
1. `compression` — gzip/brotli for responses > 1KB
2. `trust proxy: 1` — real IP behind Render/Cloudflare
3. `cors` — whitelist from CORS_ORIGINS env var
4. `cookieParser`
5. `express.json` (limit 1MB)
6. `helmet` (crossOriginResourcePolicy: cross-origin, crossOriginOpenerPolicy: unsafe-none)
7. `generalLimiter` — 300 req/min per IP
8. `customCsrfProtection` — double-submit cookie on all state-changing routes
9. Route handlers: /api/auth, /api/users, /api/projects, /api/applications, /api/notifications, /api/connections
10. 404 catch-all
11. `errorHandler`

## Database

- Local dev: SQLite (campus.db). No setup required — just run node src/server.js.
- Production: PostgreSQL. Set DATABASE_URL. SSL is enabled by default (set DATABASE_SSL=false to disable).
- ORM: Sequelize 6 with underscored: true (column names use snake_case).
- Models auto-sync on startup (sequelize.sync()). Migrations are also maintained via sequelize-cli.
- On startup, server.js runs several safe backfill operations (idempotent).

## Startup Backfills (server.js → start())
1. email_verified: Adds column if missing. Sets all existing users to true.
2. email_verification_token: Adds column if missing.
3. password_reset_token / password_reset_expires_at: Adds columns if missing.
4. is_onboarded: Adds column if missing. Sets all existing users to true.
5. experiences.location, work_type, employment_type: Adds columns if missing.
6. Postgres ENUM extension: Adds new notification type values to the enum.
7. Branch normalization: Normalizes all user branch values via courses.js.
8. ProjectMember backfill: Ensures every project owner has a ProjectMember row with is_lead: true.

## Authentication Details

### Cookie Names
- access_token — JWT, HttpOnly, Secure (prod), SameSite=None (prod) / Lax (dev)
- refresh_token — Refresh token, same flags, 7-day max age

### JWT Payload
```json
{ "userId": "uuid", "email": "user@example.com", "iat": ..., "exp": ... }
```

### requireAuth Middleware
- Reads access_token cookie.
- Verifies JWT with JWT_SECRET.
- Sets req.userId and req.user = { userId, email }.
- Returns 401 if missing or invalid.

### Refresh Token Flow
- POST /api/auth/refresh reads refresh_token cookie.
- Looks up RefreshToken record in DB (token is stored hashed).
- If valid and not expired, issues a new access_token cookie.
- Refresh tokens are rotated on each use (old one deleted, new one created).

## Rate Limiting

Custom SlidingWindowStore class (no npm dependencies beyond Express).
- Stores timestamps per key in a Map.
- Cleanup runs every 60s, removes entries older than 30min.
- authLimiter: 20 req / 15min, key = "auth:{ip}:{email}"
- generalLimiter: 300 req / 1min, key = "general:{ip}"

## Serializers (utils/serializers.js)

All API responses go through serializers to strip sensitive fields and normalize shape.

- serializeUser(user, extra) — strips password_hash, google_id, tokens. Adds profile_completion score.
- serializeProject(project) — normalizes owner, required_skills.
- serializeApplication(application) — includes applicant and project.
- serializeNotification(notification) — includes actor and project.
- serializeExperience, serializeEducation, serializeAchievement, serializeConnectionRequest.

## Email (utils/mailer.js)

- Uses Resend SDK if RESEND_API_KEY is set.
- Falls back to Nodemailer with SMTP_HOST/PORT/USER/PASS.
- verifyTransporter() checks config at startup.
- Functions: sendVerificationEmail(user, token), sendPasswordResetEmail(user, token).

## Notification Service (services/notificationService.js)

Call these from route handlers to create notifications:
- notifyProjectApplication(project, applicant) → notifies project owner
- notifyApplicationStatus(application, status) → notifies applicant
- notifyConnectionRequest(request) → notifies recipient
- notifyConnectionAccepted(request) → notifies requester
- notifyProjectUpdate(project, recipients) → notifies all members

## Profile Completion Score (utils/profileCompletion.js)

Calculates a 0-100 score based on:
- avatar_url (20pts)
- bio (15pts)
- headline (10pts)
- skills (15pts, at least 2 needed)
- github_url or linkedin_url (10pts)
- experiences (15pts)
- educations (10pts)
- achievements (5pts)

## Password Policy (utils/passwordPolicy.js)

Minimum requirements enforced on register and change-password:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

GET /api/auth/password-rules returns these rules as JSON.

## Running Locally

```bash
cd backend
cp .env.example .env
# Fill in JWT_SECRET at minimum
node src/server.js
# or for auto-restart:
node --watch src/server.js
```

Server runs on port 8000 by default. SQLite DB is created automatically.
