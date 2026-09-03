<div align="center">
  <img src="frontend/public/logo-full.png" alt="Sangam Logo" width="300" />
</div>

# Sangam

> Your campus, in motion. A platform for students to discover, connect, collaborate, and build projects together.

Sangam solves the fragmented experience of student collaboration by providing a unified platform to find co-founders, discover projects, manage teams, and track milestones. Whether you want to build something new or find your people, Sangam connects the campus ecosystem.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![React](https://img.shields.io/badge/frontend-React%20%7C%20Vite-61dafb)
![Node](https://img.shields.io/badge/backend-Node.js%20%7C%20Express-339933)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791)
![Deployment](https://img.shields.io/badge/deployment-Vercel%20%7C%20Render-black)

## Overview

Finding the right teammates for a hackathon, startup, or academic project on campus is traditionally difficult. Students rely on scattered WhatsApp groups, Discord servers, and word-of-mouth. Sangam bridges this gap by offering a centralized hub where students can showcase their skills, pitch projects, and organically form teams based on matching tech stacks and roles.

## The Problem

- **Fragmented Workflows:** Students struggle to find peers with complementary skills across different departments.
- **Lost Opportunities:** Many great ideas die because students cannot find a technical co-founder or a designer.
- **Inadequate Portfolios:** Resumes don't always capture a student's actual build history or project milestones.

## The Solution

Sangam acts as a professional network tailored specifically for the university ecosystem:
**User** → **Sangam** → **Discover Projects/Talent** → **Apply/Connect** → **Collaborate & Build**

## Key Features

- **Authentication:** Local email/password and Google OAuth integration.
- **User Profiles:** Build a comprehensive portfolio with experiences, education, and achievements.
- **Talent Discovery:** Search and filter the student directory by skills, branch, or keywords.
- **Project Creation:** Pitch ideas, define required tech stacks, set milestones, and specify open roles.
- **Project Discovery:** Browse active projects on campus and filter by matching skills.
- **Team Formation:** Add members, assign roles, and manage applications to join your project.
- **Milestones:** Track project progress with granular milestone states.
- **Connections:** Send and accept connection requests to build your network.
- **Responsive Experience:** Beautifully designed interfaces for desktop and mobile workflows.

## How Sangam Works

### Discover Talent
`Login` → `Talent` → `Search/Filter` → `Open Profile` → `Connect`

### Create a Project
`Login` → `Create Project` → `Add Details & Skills` → `Add Members & Roles` → `Define Milestones` → `Publish`

### Join a Project
`Explore` → `Open Project` → `View Details` → `Apply` → `Track Application Status`

## Architecture

```mermaid
flowchart TD
    Client[User Browser] -->|REST API| Frontend[React SPA]
    Frontend -->|JWT Auth| Backend[Node.js + Express]
    Backend -->|Sequelize ORM| DB[(PostgreSQL / SQLite)]
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React, Vite | Core UI framework and build tool |
| **Backend** | Node.js, Express | API server |
| **Database** | PostgreSQL, SQLite | Primary data storage (PG for prod, SQLite for dev) |
| **ORM** | Sequelize | Database modeling and migrations |
| **Authentication**| JWT, Google OAuth | Session management and SSO |
| **Styling** | TailwindCSS | Utility-first CSS styling |
| **Deployment** | Vercel, Render | Frontend and Backend hosting |

## Project Structure

```
sangam/
├── frontend/             # React Single Page Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React contexts (AuthContext)
│   │   ├── pages/        # Main route components
│   │   └── api.js        # API client and request handlers
│   └── package.json
├── backend/              # Express API Server
│   ├── src/
│   │   ├── config/       # Database & environment configuration
│   │   ├── middleware/   # Authentication, CSRF, and rate limiting
│   │   ├── models/       # Sequelize ORM models
│   │   ├── routes/       # API endpoint definitions
│   │   ├── services/     # Business logic (e.g., notifications)
│   │   ├── utils/        # Helpers (mailer, logger, serializers)
│   │   └── server.js     # Server entry point
│   └── package.json
└── render.yaml           # Render deployment configuration
```

## Data Model

```mermaid
erDiagram
    USER ||--o{ PROJECT : "owns"
    USER ||--o{ PROJECT_MEMBER : "has role"
    PROJECT ||--o{ PROJECT_MEMBER : "has members"
    USER ||--o{ SKILL : "has"
    PROJECT ||--o{ SKILL : "requires"
    USER ||--o{ APPLICATION : "applies"
    PROJECT ||--o{ APPLICATION : "receives"
    USER ||--o{ CONNECTION : "connects"
    PROJECT ||--o{ MILESTONE : "tracks"
```
Major Entities:
- **User**: Core identity, authentication, and portfolio data.
- **Skill**: Standardized tags for tech stacks and expertise.
- **Project**: The core collaboration entity, including status and milestones.
- **ProjectMember**: Tracks which user has what role in a specific project.
- **Application**: Join requests for open project roles.
- **Connection**: Peer-to-peer networking links.
- **Notification**: Real-time alerts for system events.

## API Overview

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| POST | `/api/auth/google` | Google SSO login |

### Projects
| Method | Endpoint | Purpose | 
|--------|----------|---------|
| GET | `/api/projects` | List active projects | 
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects/:id/members` | Add a team member |

### Users & Profiles
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users/profile` | Get current user profile |
| PATCH | `/api/users/profile` | Update profile details | 
| GET | `/api/users/:id` | Get public profile | 

### Connections & Applications
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/applications` | Apply to a project |
| POST | `/api/connections/request` | Send connection request |

## Authentication

Sangam uses stateless JSON Web Tokens (JWT) for authentication. Tokens are securely passed between the client and server. The platform also supports Google OAuth via Google Identity Services, allowing one-click sign-ins without managing passwords. Protected routes are secured by an Express middleware that validates the token signature and expiration.

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=8000
NODE_ENV=development
JWT_SECRET=your_secure_random_string
JWT_EXPIRE_MINUTES=10080
DATABASE_STORAGE=campus.db # Used for local SQLite
# DATABASE_URL=postgresql://user:pass@host:5432/db # For production Postgres
CORS_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/sangam.git
cd sangam
```

**2. Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
*Note: The backend runs on `http://localhost:8000` and uses SQLite by default for zero-config local development.*

**3. Setup Frontend**
Open a new terminal window:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
*Note: The frontend runs on `http://localhost:5173`.*

## Production Build

To build the frontend for production:
```bash
cd frontend
npm run build
```
This generates optimized static files in the `dist` directory.

## Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on Vercel. A `vercel.json` is included for proper client-side routing.
Set the `VITE_API_URL` environment variable in the Vercel dashboard to point to your live backend URL.

### Backend (Render)
The backend is configured for deployment on Render via the included `render.yaml`.
It automatically runs database migrations (`npm run migrate`) during the build phase. You must provision a PostgreSQL database on Render and set the `DATABASE_URL` environment variable.

## Security

- **Password Hashing:** Implemented using `bcryptjs`.
- **JWT:** Stateless authentication for secure sessions.
- **CSRF Protection:** Custom Double Submit Cookie pattern implemented for state-changing API routes.
- **Rate Limiting:** Global rate limiting applied to prevent brute-force attacks.
- **Helmet:** Secure HTTP headers and Cross-Origin policies enforced.
- **CORS:** Strictly configured to allow only authorized frontend origins.

## Testing

Automated testing infrastructure is configured using `Vitest` and `React Testing Library` on the frontend, and `Jest` + `Supertest` on the backend. 
*Note: Automated E2E coverage is currently limited; core flows should be manually verified before production deployment.*

## Project Status

- ✅ User Authentication & Profiles
- ✅ Project Creation & Team Management
- ✅ Talent Discovery & Search
- ✅ Connections & Applications
- 🚧 Real-time WebSocket Chat (Planned)
- 📌 Email Notifications Integration

## Roadmap

**Completed:**
- Core API architecture and database schemas
- Frontend dashboard, profile, and project workflows
- Google OAuth integration

**Next:**
- Expanded analytics dashboard for project leads
- In-app direct messaging

**Future:**
- University-specific SSO integration (SAML/Shibboleth)
- Mobile application (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

- **CORS Errors:** Ensure your frontend URL is exactly matched in the backend's `CORS_ORIGINS` environment variable.
- **Database Connection:** If deploying to production, ensure `DATABASE_URL` uses the correct PostgreSQL connection string and SSL is appropriately configured for your provider.
- **Google OAuth Fails:** Ensure your Google Cloud Console has authorized `http://localhost:5173` as a JavaScript Origin.

## License

MIT License

## Acknowledgements

- UI Icons provided by [Lucide](https://lucide.dev/)
- Built with [React](https://reactjs.org/) and [TailwindCSS](https://tailwindcss.com/)
- API powered by [Express](https://expressjs.com/) and [Sequelize](https://sequelize.org/)
