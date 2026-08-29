# Sangam — Master Project Context

> **Purpose**: This file is the complete, authoritative reference for the Sangam project. Any agent or developer starting work here should read this first. It covers architecture, tech stack, all routes/APIs, data models, design system, auth flow, deployment, and important rules.

---

## 1. What Is Sangam?

Sangam is a **campus collaboration platform** for Rishihood University students. It allows students to:
- Post and discover projects (startup ideas, research, hackathon teams, open-source)
- Search for talented teammates by skill
- Send and accept connection requests (LinkedIn-style)
- Manage a personal profile/portfolio (bio, skills, experience, education, achievements)
- Apply to projects and manage team membership with roles and milestones
- Receive real-time-ish notifications for all social events

**Live URLs**:
- Frontend: https://sangam-wheat.vercel.app
- Backend: https://campus-log-api.onrender.com
- GitHub: https://github.com/ARRAEYY/sangam

---

## 2. Repository Structure

```
Campus-log 3/              ← monorepo root
├── backend/               ← Node.js / Express API
│   ├── src/
│   │   ├── server.js      ← Express app entry point + middleware stack
│   │   ├── config/
│   │   │   └── database.js  ← Sequelize setup (SQLite dev / Postgres prod)
│   │   ├── models/          ← Sequelize models + associations (index.js)
│   │   ├── routes/          ← Express routers (one file per domain)
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── projects.js
│   │   │   ├── applications.js
│   │   │   ├── notifications.js
│   │   │   └── connections.js
│   │   ├── middleware/
│   │   │   ├── auth.js        ← requireAuth JWT middleware
│   │   │   ├── rateLimit.js   ← sliding window rate limiter
│   │   │   └── errorHandler.js
│   │   ├── services/
│   │   │   └── notificationService.js
│   │   └── utils/
│   │       ├── mailer.js         ← Resend + Nodemailer email
│   │       ├── serializers.js    ← serializeUser, serializeProject, etc.
│   │       ├── profileCompletion.js
│   │       ├── passwordPolicy.js
│   │       ├── courses.js        ← branch/course name normalization
│   │       ├── auth.js           ← JWT helpers
│   │       └── experienceTypes.js
│   ├── .env.example
│   └── package.json
├── frontend/              ← React 18 + Vite + TailwindCSS SPA
│   ├── src/
│   │   ├── main.jsx       ← React entry, wraps AuthProvider + BrowserRouter
│   │   ├── App.jsx        ← Route definitions + application shell layout
│   │   ├── api.js         ← All API calls via a single fetch wrapper
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MobileBottomNav.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── Skeletons.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── GoogleSignInButton.jsx
│   │   │   ├── SangamLogo.jsx
│   │   │   ├── FormattedText.jsx
│   │   │   └── SkillTagInput.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Explore.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   ├── CreateProject.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TalentSearch.jsx
│   │   │   └── Notifications.jsx
│   │   └── index.css      ← Global CSS + design tokens
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── vercel.json        ← SPA rewrites for Vercel
├── render.yaml            ← Backend deployment for Render.com
└── README.md
```

---

## 3. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js v26+ |
| Framework | Express 4 |
| ORM | Sequelize 6 |
| DB (dev) | SQLite (campus.db file) |
| DB (prod) | PostgreSQL (via DATABASE_URL) |
| Auth | JWT in HttpOnly cookie + Refresh Token in HttpOnly cookie |
| Security | helmet, custom CSRF double-submit cookie, bcryptjs |
| Email | Resend API (primary) + Nodemailer fallback |
| Rate Limiting | Custom in-memory sliding window (no Redis needed) |
| Compression | compression middleware (gzip/brotli, threshold 1KB) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 |
| Bundler | Vite |
| Styling | TailwindCSS v3 + custom CSS design tokens |
| Routing | React Router v6 |
| HTTP | Native fetch via src/api.js wrapper |
| Auth State | React Context (AuthContext) |
| Icons | lucide-react |
| Fonts | Inter (body), Fraunces (headings) via Google Fonts |

---

## 4. Environment Variables

### Backend (backend/.env)
| Variable | Required | Default | Description |
|---|---|---|---|
| PORT | No | 8000 | Port the API listens on |
| NODE_ENV | No | development | Set to "production" in prod |
| JWT_SECRET | YES | — | Secret for signing JWTs |
| JWT_EXPIRE_MINUTES | No | 10080 (7d) | Access token lifetime |
| DATABASE_URL | Prod only | — | PostgreSQL connection string |
| DATABASE_STORAGE | No | campus.db | Path to SQLite file (dev only) |
| DATABASE_SSL | No | true | Set to "false" to disable Postgres SSL |
| CORS_ORIGINS | YES | — | Comma-separated list of allowed frontend origins |
| GOOGLE_CLIENT_ID | No | — | Google OAuth Client ID |
| RESEND_API_KEY | No | — | Resend API key for transactional email |
| SMTP_HOST/PORT/USER/PASS | No | — | Fallback SMTP if Resend unavailable |

### Frontend (frontend/.env)
| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | YES | Full backend URL e.g. https://campus-log-api.onrender.com |
| VITE_GOOGLE_CLIENT_ID | No | Same Google OAuth client ID as backend |

---

## 5. Application Shell & Routing

### Route Map
| Path | Page | Auth Required | Notes |
|---|---|---|---|
| / | Landing.jsx | No | Full-bleed marketing page |
| /auth | Auth.jsx | No | Login/Register tabs |
| /onboarding | Onboarding.jsx | No | Post-signup profile setup |
| /reset-password | ResetPassword.jsx | No | Email token-based reset |
| /explore | Explore.jsx | YES | Browse open projects |
| /talent | TalentSearch.jsx | YES | Search students by skill |
| /projects/:id | ProjectDetail.jsx | YES | Full project detail + team + milestones |
| /create | CreateProject.jsx | YES | Create/edit project form |
| /dashboard | Dashboard.jsx | YES | Own profile + my projects + connections |
| /notifications | Notifications.jsx | YES | Notification center |

### Layout Shell (App.jsx)
- Routes /, /auth, /onboarding, /reset-password are full-bleed — no sidebar or mobile nav.
- All other authenticated routes use the app shell: Navbar + Sidebar (desktop) + MobileBottomNav.
- The sidebar gutter is a w-[92px] shrink-0 div reserving space for the fixed Sidebar.
- Main content uses mx-auto max-w-5xl for horizontal centering.

---

## 6. Authentication Flow

### Token Strategy
- Access Token: JWT in HttpOnly, Secure, SameSite=None cookie (access_token). Default 7 days.
- Refresh Token: HttpOnly cookie (refresh_token). 7 days. Used for silent renewal.
- NO Authorization header. Auth is entirely cookie-based (credentials: "include" on all fetches).

### CSRF Protection
- Double-submit cookie pattern.
- GET /api/csrf-token sets a _csrf HttpOnly cookie and returns the token as JSON.
- All POST/PUT/PATCH/DELETE requests must include the token in a CSRF-Token header.
- The api.js wrapper handles this automatically via getCsrfToken().
- CSRF is bypassed for GET/HEAD/OPTIONS methods.

### Auth Providers
1. Local (email + password): Registration → email verification → login.
2. Google OAuth (GIS): Client-side sign-in, backend verifies ID token. New Google users go through /api/auth/onboard.

### Auth Middleware (middleware/auth.js)
- requireAuth: Verifies JWT from access_token cookie. Attaches req.user and req.userId. Returns 401 on failure.

### AuthContext (Frontend)
- Tries api.getProfile() on mount to restore session from cookie.
- Exposes: user, loading, login, loginWithGoogle, register, logout, refreshProfile.
- user is null when logged out or loading.

### Silent Token Refresh (Frontend)
- api.js catches 401 responses.
- Automatically calls POST /api/auth/refresh for a new access token.
- Retries the original request once on success.

---

## 7. Backend API Reference

Base: http://localhost:8000 (dev) / https://campus-log-api.onrender.com (prod)

All routes are prefixed with /api/. Mutation routes require CSRF-Token header.

### Auth — /api/auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /register | No | Register. Sends verification email. |
| POST | /login | No | Login. Sets access + refresh cookies. |
| POST | /google | No | Google ID token login/register. |
| POST | /onboard | No | Complete profile for new Google users. |
| POST | /logout | No | Clears cookies. |
| POST | /refresh | No | Silently renews access token from refresh cookie. |
| GET | /verify-email | No | Verify email via ?token= query param. |
| POST | /resend-verification | No | Resend verification email. |
| POST | /forgot-password | No | Send password reset link. |
| POST | /reset-password | No | Reset password using token from email. |
| POST | /change-password | YES | Change password (requires current password). |
| GET | /password-rules | No | Returns password policy. |

### Users — /api/users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /profile | YES | Own full profile (skills, experiences, etc.) |
| PATCH | /profile | YES | Update profile fields |
| DELETE | /profile | YES | Delete own account |
| GET | /:id/public | YES | Another user's public profile |
| GET | /talent | YES | Search/filter users by skill (paginated) |
| GET | /search | YES | Search users by name (?q=) |
| POST | /experience | YES | Add experience |
| PUT | /experience/:id | YES | Update experience |
| DELETE | /experience/:id | YES | Delete experience |
| GET | /education | YES | List own education |
| POST | /education | YES | Add education |
| PUT | /education/:id | YES | Update education |
| DELETE | /education/:id | YES | Delete education |
| GET | /achievements | YES | List own achievements |
| POST | /achievements | YES | Add achievement |
| PUT | /achievements/:id | YES | Update achievement |
| DELETE | /achievements/:id | YES | Delete achievement |

### Projects — /api/projects
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /teaser | No | 3 public OPEN projects for landing page |
| GET | / | YES | Paginated/filtered project list |
| POST | / | YES | Create project |
| GET | /:id | YES | Project detail |
| PUT | /:id | YES | Edit project (owner only) |
| DELETE | /:id | YES | Delete project (owner only) |
| PATCH | /:id/status | YES | Update status (owner only) |
| POST | /:id/apply | YES | Apply with pitch message |
| GET | /:id/apps | YES | List applicants (owner only) |
| GET | /:id/members | YES | Team member list |
| POST | /:id/members | YES | Add member directly (owner only) |
| PATCH | /:id/members/:userId | YES | Update member role (owner only) |
| DELETE | /:id/members/:userId | YES | Remove member (owner only) |
| POST | /:id/members/:userId/leave | YES | Member leaves voluntarily |
| GET | /:id/milestones | YES | List milestones |
| POST | /:id/milestones | YES | Create milestone (owner only) |
| PATCH | /:id/milestones/:milestoneId | YES | Update milestone |
| DELETE | /:id/milestones/:milestoneId | YES | Delete milestone (owner only) |

### Applications — /api/applications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /mine | YES | My own applications |
| PATCH | /:id | YES | Accept/reject + assign role (owner) |

### Notifications — /api/notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | YES | All notifications for current user |
| GET | /unread-count | YES | Unread notification count |
| PATCH | /:id/read | YES | Mark single as read |
| PATCH | /read-all | YES | Mark all as read |
| DELETE | /:id | YES | Delete notification |

### Connections — /api/connections
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /requests | YES | Send connection request |
| GET | /requests | YES | List sent or received requests (?direction=sent|received) |
| PATCH | /requests/:id | YES | Accept or reject request |
| DELETE | /requests/:id | YES | Withdraw pending request |
| GET | / | YES | List established connections |
| DELETE | /:id | YES | Remove connection |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/health | No | DB health check |
| GET | /api/csrf-token | No | Get CSRF token + set cookie |

---

## 8. Data Models

### User
Fields: id (UUID PK), email (unique), password_hash, google_id, auth_provider (LOCAL|GOOGLE), email_verified, email_verification_token, is_onboarded, password_reset_token, password_reset_expires_at, full_name, branch, graduation_year, headline, location, bio, avatar_url, github_url, linkedin_url, portfolio_url, leetcode_url, codeforces_url.

### Project
Fields: id (UUID PK), title, description, team_size_needed, status (OPEN|IN_PROGRESS|COMPLETED|ARCHIVED), owner_id (FK→users).

### Application
Fields: id (UUID PK), project_id (FK→projects), user_id (FK→users), pitch_message, status (PENDING|ACCEPTED|REJECTED), applied_at.

### ProjectMember
Fields: id, project_id (FK→projects), user_id (FK→users), role (string), role_category (LEAD|TECH|DESIGN|MARKETING|OTHER), is_lead (bool), status (ACTIVE|INACTIVE).

### Milestone
Fields: id (UUID PK), project_id (FK→projects), title, description, due_date, is_completed (bool), completed_at, created_by (FK→users).

### Notification
Fields: id (UUID PK), recipient_id, actor_id, type (ENUM), message, project_id, connection_request_id, is_read (bool).
Types: PROJECT_APPLICATION, APPLICATION_ACCEPTED, APPLICATION_REJECTED, CONNECTION_REQUEST, CONNECTION_ACCEPTED, CONNECTION_REJECTED, PROJECT_UPDATE, MEMBER_ROLE_ASSIGNED, MEMBER_REMOVED, MILESTONE_COMPLETED.

### ConnectionRequest
Fields: id (UUID PK), requester_id, recipient_id, status (PENDING|ACCEPTED|REJECTED), message.

### Connection
Fields: id (UUID PK), user_a_id, user_b_id. Bidirectional established link.

### Skill
Fields: id (UUID PK), name. Users and Projects have M:M with Skill via UserSkill / ProjectSkill.

### Experience
Fields: id, user_id, organization, role, description, location, work_type, employment_type, start_date, end_date.

### Education
Fields: id, user_id, institution, degree, department, start_year, graduation_year.

### Achievement
Fields: id, user_id, type, title, description, issuer, date_awarded, url.

### RefreshToken
Fields: id, user_id, token (hashed), expires_at.

---

## 9. Design System

### Brand Colors (CSS Variables in index.css)
| Token | Value | Usage |
|---|---|---|
| --color-primary | #a5002c | Buttons, active nav, accents (deep maroon) |
| --color-background | #f7f6f3 | Page background (warm cream) |
| --color-card | #FFFFFF | Card backgrounds |
| --color-muted | #f8fafc | Subtle backgrounds |
| --color-border | #f1f5f9 | Card/input borders |

In Tailwind: bg-brand-600 = primary maroon, bg-cream-100 = page bg.

### Typography
- Display/headings: Fraunces (serif) — h1, h2, h3, .font-display
- Body/UI: Inter (sans-serif) — default

### Utility Classes (index.css)
- .input — standard form input
- .card — white card with shadow (rounded-2xl)
- .btn-primary — filled maroon rounded-full button
- .btn-secondary — outlined white button
- .btn-ghost — ghost/text button
- .pill — small tag/chip
- .icon-nav-btn — 44px square icon button

---

## 10. Sidebar Layout Rules (CRITICAL)

Do NOT break these constraints when modifying the sidebar or layout:

1. Sidebar is position: fixed; left: 20px (left-5 = 20px); top: 64px; height: calc(100vh - 64px).
2. Default collapsed width: 72px (icon only).
3. Hover expanded width: 240px (icon + label) — via CSS absolute overlay, NOT flex resize.
4. The expanded sidebar overlays the content. It does NOT push the page.
5. Text labels use: opacity-0, w-0, -translate-x-2 → opacity-100, w-auto, translate-x-0 on group-hover.
6. App shell gutter: w-[92px] shrink-0 — reserves space for the sidebar without dynamic width.
7. The sidebar's LEFT EDGE MUST NEVER MOVE.
8. Logout is anchored to bottom via mt-auto in the flex column.
9. Active item: only the 44x44 icon div gets bg-brand-600 text-white. NOT the full row.
10. NO card/shadow/border on the sidebar itself. It blends into the page bg.
11. Transition: duration-300 ease-out on all interactive properties.

---

## 11. Talent Card Rules (CRITICAL)

Do NOT break these constraints when modifying TalentSearch:

1. Cards use CSS Grid (3 columns on desktop).
2. Each card is flex flex-col h-full.
3. Bio section has min-h-[40px] — empty if no bio (no placeholder text).
4. Skills section has h-[52px] overflow-hidden — max 4 pills + +N chip.
5. Footer (social icons + Connect button) uses mt-auto to always bottom-align.
6. Never show "No bio added yet" or "No skills listed yet" placeholder text.

---

## 12. Deployment

### Backend — Render.com
- Service: campus-log-api, Plan: free
- Root: backend/, Build: npm install && npm run migrate, Start: npm start
- Health check: /api/health
- Env vars in Render dashboard: JWT_SECRET, DATABASE_URL, CORS_ORIGINS, GOOGLE_CLIENT_ID, RESEND_API_KEY

### Frontend — Vercel
- Framework: Vite, Root: frontend/
- vercel.json rewrites all paths to /index.html for SPA routing
- Env vars: VITE_API_URL, VITE_GOOGLE_CLIENT_ID
- Production URL: https://sangam-wheat.vercel.app

### Google OAuth
- Use Google Identity Services (GIS) — client-side sign-in, no redirect URI needed.
- Add Authorized JavaScript Origins in Google Cloud Console for every frontend URL.
- Error 400: origin_mismatch = the current URL is not in the authorized origins list.

---

## 13. Rate Limiting

Custom in-memory sliding window (no Redis, single-instance).

| Limiter | Window | Max | Key |
|---|---|---|---|
| authLimiter | 15 min | 20 | IP + email |
| generalLimiter | 1 min | 300 | IP |

authLimiter applies to: /register, /login, /forgot-password, /reset-password, /resend-verification, /google.

---

## 14. Email System

- Primary: Resend API (RESEND_API_KEY env var).
- Fallback: Nodemailer (SMTP_HOST/PORT/USER/PASS).
- All email functions are in utils/mailer.js.
- verifyTransporter() is called at startup to log SMTP status.

---

## 15. Key Business Logic

1. Email verification is mandatory for local accounts before login.
2. Google users are auto-verified (email_verified = true).
3. is_onboarded = false users are redirected to /onboarding after login.
4. Profile completion score is computed in serializeUser() via profileCompletion.js.
5. Project owner is always a ProjectMember with role_category: LEAD, is_lead: true. Auto-backfilled on startup.
6. Branch/course names are normalized to canonical values via courses.js on startup.
7. Connections are bidirectional. user_a_id is always the lower UUID to prevent duplicates.
8. All social events trigger Notification creation via notificationService.js.
9. Existing users with email_verified = false are backfilled to true on startup (avoids lockout after migration).
10. Existing users with is_onboarded = false are backfilled to true on startup.

---

## 16. Common Gotchas

- Error 400: origin_mismatch on Google sign-in → add frontend URL to Google Cloud Console authorized origins.
- CSRF token errors after logout → page refresh clears the cached token.
- SQLite vs Postgres query differences → use sequelize.literal() for complex queries.
- trust proxy: 1 is set — required for accurate IP-based rate limiting behind Render/Cloudflare.
- Compression threshold is 1KB — tiny error responses are not compressed (intentional).
- email_verified and is_onboarded backfills run on every server startup (idempotent and safe).
