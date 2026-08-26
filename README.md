# Sangam — Campus Project & Collaboration Platform

Sangam is a private student collaboration and project execution platform built exclusively for **Rishihood University**. It bridges the gap between campus builders across Computer Science, AI, Design, and Business — allowing students to discover peers, assemble project squads with structured roles, manage milestone progress, and build a verified portfolio of shipped work.

---

## 📌 Problem

In college campuses, students frequently face friction when building projects, preparing for hackathons, or launching startups:
- **Fragmented Discovery**: Finding someone with complementary skills (e.g. an AI engineer needing a Figma designer) requires word-of-mouth or crowded WhatsApp groups.
- **Lack of Structure**: Projects often fail due to unclear ownership, lack of defined roles, and zero stage visibility.
- **Unverified Experience**: Resumes rely on unverified claims rather than verifiable campus project track records.

---

## 🎯 What is Sangam?

Sangam is a lightweight project management and peer collaboration layer:
1. **Verified Student Network**: Restricted exclusively to `@rishihood.edu.in` accounts.
2. **Project Teams & Rosters**: Move beyond simple bulletin boards to structured teams with explicit roles (`Frontend`, `Backend`, `AI`, `Design`, `Product`, etc.).
3. **Stage & Milestone Tracking**: Measure project progress with deliverables and real-time completion bars.
4. **Verified Builder Portfolios**: Every completed role and project automatically builds your public campus profile.

---

## ⚡ Current Features (Fully Implemented & Working)

### 1. Authentication & Security
- **Campus Email Gating**: Locked to `@rishihood.edu.in` and subdomains (`@*.rishihood.edu.in`).
- **Google OAuth / GIS**: "Continue with Google" token verification with domain validation.
- **Password Strength & Reset**: 12+ character enforcement with SHA-256 expiring reset links.
- **Access Gating**: All core pages (`/explore`, `/talent`, `/projects/:id`, `/dashboard`, `/create`, `/notifications`) protected with server and client auth guards.
- **Safe Open-Redirect Defense**: Validates and sanitizes post-login redirect paths against an allowlisted set of routes.

### 2. Student Profiles & Portfolio
- **Canonical Course Selection**: Controlled dropdown for verified university courses (`B-Tech CS & AI`, `B-Tech CS & DS`, `B.Design`, `Bsc Phy`, `BBA`).
- **Dynamic Profile Completion**: Weighted 0–100% completion bar with smart next-step recommendation prompts.
- **Extended Portfolio**: Work experience, education history, hackathon & certification achievements, avatar photos, and social/code links (GitHub, LinkedIn, Portfolio, LeetCode, Codeforces).
- **Verified Project History (LinkedIn-Style)**: Displays active and past project roles with badges and lead crowns.

### 3. Projects & Team Collaboration
- **Project Workspaces**: Post projects with required skill tags, description, and team size needed.
- **Auto-Lead Assignment**: Project creator is automatically registered as Project Lead.
- **Direct Member Addition**: Project leads can search existing Sangam students by name or email and add them directly with specific roles and categories.
- **Pitch Applications**: Students can pitch to open projects; leads can accept with role assignment or reject.
- **Team Roster Management**: Leads can edit roles and remove members; non-lead members can self-leave.
- **Duplicate Protection**: Guards prevent duplicate active memberships and handle reactivations cleanly.

### 4. Milestones & Progress Tracking
- **Milestone Management**: Project leads can create, edit, reorder, and delete deliverable milestones with optional due dates.
- **Status Lifecycle**: `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` / `BLOCKED`.
- **Dynamic Progress Bar**: Live calculation of completion percentage and deliverables count.
- **Milestone Notifications**: Broadcasting milestone completions to all active project teammates.

### 5. Talent Directory & Networking
- **Student Directory**: Search and filter peers by specific tech stack (React, Python, Figma, etc.).
- **Campus Connections**: Send personalized connection requests, accept/decline, and manage mutual connections.
- **Public Profile Modal**: View peer portfolios, project experience, skills, and achievements.

### 6. Notification Center
- Real-time in-app notifications for applications, decisions, connection requests, role assignments, member removals, and milestone completions.

---

## 🗺️ Core User Flow

```
1. Landing Page
   │  (Explains value proposition, showcases live public project teasers)
   ▼
2. Sign Up / Sign In
   │  (Campus email verification or Google OAuth + Canonical Course selection)
   ▼
3. Complete Profile
   │  (Follow dynamic completion bar: bio, skills, socials, education, achievements)
   ▼
4. Discover & Connect
   │  (Explore open projects by skill or search student talent directory)
   ▼
5. Form Teams & Assign Roles
   │  (Post a project, accept applicant pitches, or directly invite peers with roles)
   ▼
6. Track Milestones & Ship
   │  (Check off project deliverables, progress bar updates in real-time)
   ▼
7. Build Verified Portfolio
   │  (Shipped projects automatically populate your public profile)
```

---

## 👥 Benefits

- **For Students**: Find cross-disciplinary peers, gain team project experience, and build a verified builder profile.
- **For Project Leads**: Assemble squads quickly with direct invites or pitch applications, define clear roles, and track deliverable milestones.
- **For Team Members**: Transparent project roadmap, defined responsibilities, and documented project experience.
- **For the Campus Community**: Bridges silos between engineering, design, and business departments, fostering an active shipping culture.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite 5
- **Styling**: Tailwind CSS with customized typography & design system
- **Routing**: React Router v6 (with ProtectedRoute wrappers)
- **Icons**: Lucide React
- **Auth**: Google Identity Services (GIS) Web SDK + JWT Cookies

### Backend
- **Runtime**: Node.js (v20+)
- **Server**: Express.js
- **ORM**: Sequelize v6
- **Databases**:
  - **Development**: SQLite (`campus.db`, zero-config local setup)
  - **Production**: PostgreSQL (Neon Serverless Postgres)
- **Security**: Rate Limiting (`express-rate-limit`), Cookie-Parser, Bcryptjs, SHA-256 Tokens

---

## 🏗️ Architecture

```
Campus-log/
├── backend/
│   ├── src/
│   │   ├── config/          # Sequelize DB config (Postgres in prod, SQLite in dev)
│   │   ├── middleware/      # Auth (JWT cookie/header), RateLimit, ErrorHandler
│   │   ├── models/          # User, Project, ProjectMember, Milestone, Application,
│   │   │                    # Skill, Notification, Connection, Experience, Education, Achievement
│   │   ├── routes/          # auth, users, projects, applications, notifications, connections
│   │   ├── scripts/         # Safe backfill scripts (backfillProjectMembers.js)
│   │   ├── services/        # Centralized notification service
│   │   ├── utils/           # Password policy, courses, profile completion, serializers, mailer
│   │   └── server.js        # Server bootstrap & safe startup schema migrations
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, ProjectCard, ProtectedRoute, GoogleSignIn, etc.
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Landing, Auth, Explore, ProjectDetail, CreateProject,
│   │   │                    # Dashboard, TalentSearch, Notifications, ResetPassword
│   │   ├── utils/           # Canonical courses list
│   │   ├── api.js           # Centralized API request client
│   │   └── App.jsx          # Route declarations & shell layout
```

---

## ⚙️ Environment Setup

### `backend/.env`
```env
PORT=8000
NODE_ENV=development
JWT_SECRET=your_long_random_jwt_secret_key
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173

# Production Database (Leave unset for local SQLite)
# DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
# DATABASE_SSL=true

# Google OAuth (Optional for local dev)
# GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# SMTP Email Configuration (Optional for password resets)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=584
# SMTP_USER=your_email@domain.com
# SMTP_PASS=your_app_password
# SMTP_FROM="Sangam <noreply@sangam.edu>"
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:8000
# VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## 🚀 Running Locally

1. **Clone & Install Backend**:
   ```bash
   cd backend
   npm install
   npm run dev        # Runs Express on http://localhost:8000
   ```

2. **Install & Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev        # Runs Vite on http://localhost:5173
   ```

---

## 🚢 Production Deployment

- **Frontend**: Hosted on [Vercel](https://vercel.com) (SPA routing with `vercel.json` rewrite rules).
- **Backend**: Hosted on [Render](https://render.com) as a persistent Web Service.
- **Database**: Managed PostgreSQL on [Neon](https://neon.tech).

---

## 📋 Current Intentional Limitations

- **Email Domain**: Registration is strictly limited to `@rishihood.edu.in` and university subdomains.
- **Leadership Transfer**: Project ownership transfer is currently handled directly by project leads; multiple leads per project is intentionally disallowed.
- **Team Scope**: Teams are scoped to student builders on campus; public internet visitors can only view sanitized teasers without sensitive student data.
