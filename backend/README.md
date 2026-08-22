# Campus Platform Backend

This backend was derived from the existing frontend contract in the Campus Platform app.

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   npm install
3. Start the API:
   npm run dev
4. Seed demo data:
   npm run seed

## API base

http://localhost:8000

## Key routes

- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/profile
- PATCH /api/users/profile
- GET /api/users/talent
- GET /api/projects
- GET /api/projects/:id
- POST /api/projects
- PATCH /api/projects/:id/status
- POST /api/projects/:id/apply
- GET /api/projects/:id/apps
- GET /api/applications/mine
- PATCH /api/applications/:id
