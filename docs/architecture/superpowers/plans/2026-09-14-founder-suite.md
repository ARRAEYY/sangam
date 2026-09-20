# Founder Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Founder/Admin "Super-View" suite, including the Attention Center, Kanban Task Board, and Tinder-style Recruiting Pipeline.

**Architecture:** A dedicated `/founder` namespace on the frontend and specialized "Power" endpoints on the backend, all gated by a `checkProjectLead` security layer. The system uses a "Super-View" model where Admin access is additive.

**Tech Stack:** Node.js/Express (Backend), React/Framer Motion (Frontend), PostgreSQL (DB).

**Spec:** `docs/superpowers/specs/2026-09-14-founder-suite-design.md`

## Global Constraints
- All `/founder` routes must be guarded by `FounderGuard`.
- All `/founder` API endpoints must use `checkProjectLead` middleware.
- Recruiting actions (`ACCEPT`) must be atomic transactions.
- Kanban moves must use optimistic updates with rollback.
- UI must use high-contrast "Power Mode" accents (Deep Indigo/Gold).

---

## File Mapping

### Backend
- **Create:** `backend/src/middleware/founderAuth.js` (Lead verification)
- **Modify:** `backend/src/routes/projects.js` (Attention, Task Review, Task Create)
- **Modify:** `backend/src/routes/applications.js` (Applicant Action endpoint)
- **Modify:** `backend/src/services/notificationService.js` (Event triggers)

### Frontend
- **Create:** `frontend/src/components/auth/FounderGuard.jsx` (Role verification)
- **Create:** `frontend/src/pages/founder/FounderHub.jsx` (Global hub)
- **Create:** `frontend/src/pages/founder/ProjectOverview.jsx` (Attention Center)
- **Create:** `frontend/src/pages/founder/ProjectTasks.jsx` (Kanban Board)
- **Create:** `frontend/src/pages/founder/ProjectApplications.jsx` (Tinder Cards)
- **Create:** `frontend/src/pages/founder/ProjectTeam.jsx` (Roster management)
- **Create:** `frontend/src/pages/founder/ProjectSettings.jsx` (Configuration)
- **Create:** `frontend/src/components/founder/KanbanBoard.jsx` (UI Logic)
- **Create:** `frontend/src/components/founder/ApplicantCard.jsx` (UI Logic)
- **Create:** `frontend/src/components/founder/ReviewDrawer.jsx` (UI Logic)
- **Modify:** `frontend/src/App.jsx` (Route registration)
- **Modify:** `frontend/src/pages/ProjectDetail.jsx` (Add "Manage Project" button)

---

## Tasks

### Task 1: Project Lead Middleware
**Files:**
- Create: `backend/src/middleware/founderAuth.js`
- Test: `backend/tests/middleware/founderAuth.test.js`

**Interfaces:**
- Produces: `checkProjectLead(req, res, next)` middleware.

- [ ] **Step 1: Write failing test for `checkProjectLead`**
```javascript
it('should return 403 if user is not project owner or lead', async () => {
    const res = await request(app).get('/founder/projects/1/overview').set('Authorization', 'Bearer non-lead-token');
    expect(res.status).toBe(403);
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `checkProjectLead`**
  - Check `Project.owner_id === req.user.id`
  - OR check `ProjectMember.findOne({ where: { project_id, user_id: req.user.id, is_lead: true } })`
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

### Task 2: The Attention API
**Files:**
- Modify: `backend/src/routes/projects.js`
- Test: `backend/tests/routes/projects.test.js`

**Interfaces:**
- Consumes: `checkProjectLead`
- Produces: `GET /founder/projects/:id/attention`

- [ ] **Step 1: Write failing test for `/attention` endpoint**
```javascript
it('should return aggregated alerts for project lead', async () => {
    const res = await request(app).get('/founder/projects/1/attention').set('Authorization', 'Bearer lead-token');
    expect(res.body).toHaveProperty('alerts');
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `/attention` logic**
  - Query `ProjectApplication` where `status === 'Pending'`
  - Query `Task` where `status === 'Blocked'`
  - Query `Task` where `status === 'Ready for Review'`
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

### Task 3: Atomic Recruiting Actions
**Files:**
- Modify: `backend/src/routes/applications.js`
- Test: `backend/tests/routes/applications.test.js`

**Interfaces:**
- Consumes: `checkProjectLead`
- Produces: `POST /founder/projects/:id/applicants/:appId/action`

- [ ] **Step 1: Write failing test for `ACCEPT` action**
```javascript
it('should atomically accept applicant and create member', async () => {
    const res = await request(app).post('/founder/projects/1/applicants/5/action').send({ action: 'ACCEPT' }).set('Authorization', 'Bearer lead-token');
    expect(res.status).toBe(200);
    // Verify ProjectMember exists and Role filled_count incremented
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `PROCESS_APP` with Transaction**
  - Start `sequelize.transaction()`
  - Update `ProjectApplication.status`
  - Create `ProjectMember`
  - Increment `ProjectRole.filled_count`
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

### Task 4: Task Review API
**Files:**
- Modify: `backend/src/routes/projects.js`
- Test: `backend/tests/routes/projects.test.js`

**Interfaces:**
- Consumes: `checkProjectLead`
- Produces: `POST /founder/projects/:id/tasks/:taskId/review`

- [ ] **Step 1: Write failing test for `APPROVE` action**
```javascript
it('should mark task as COMPLETED on approval', async () => {
    const res = await request(app).post('/founder/projects/1/tasks/10/review').send({ decision: 'APPROVE' }).set('Authorization', 'Bearer lead-token');
    expect(res.status).toBe(200);
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `REVIEW_TASK` logic**
  - If `APPROVE` $\rightarrow$ set `Task.status = 'Completed'`
  - If `REQUEST_CHANGES` $\rightarrow$ set `Task.status = 'In Progress'`, create `TaskComment` with type `comment`.
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

### Task 5: Admin Task Creation
**Files:**
- Modify: `backend/src/routes/projects.js`
- Test: `backend/tests/routes/projects.test.js`

**Interfaces:**
- Consumes: `checkProjectLead`
- Produces: `POST /founder/projects/:id/tasks`

- [ ] **Step 1: Write failing test for admin task creation**
- [ ] **Step 2: Implement `CREATE_TASK` endpoint**
  - Validate input
  - Create `Task` record
- [ ] **Step 3: Run test to verify pass**
- [ ] **Step 4: Commit**

### Task 6: Frontend Guard & Namespace
**Files:**
- Create: `frontend/src/components/auth/FounderGuard.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: Protected route wrapper for `/founder`

- [ ] **Step 1: Implement `FounderGuard` component**
  - Call `/projects/:id/context` or a similar endpoint to check `is_lead`
  - Redirect to `/projects/:id` if unauthorized
- [ ] **Step 2: Register `/founder` routes in `App.jsx`**
- [ ] **Step 3: Verify redirection for non-admins**
- [ ] **Step 4: Commit**

### Task 7: Founder Hub & Project Overview
**Files:**
- Create: `frontend/src/pages/founder/FounderHub.jsx`
- Create: `frontend/src/pages/founder/ProjectOverview.jsx`

**Interfaces:**
- Consumes: `GET /founder/projects/:id/attention`

- [ ] **Step 1: Implement `FounderHub` (Global project list)**
- [ ] **Step 2: Implement `ProjectOverview` (Attention Center)**
  - Render "Action Cards" for pending apps, blocked tasks, and reviews.
- [ ] **Step 3: Verify data fetch and rendering**
- [ ] **Step 4: Commit**

### Task 8: The Recruiting Pipeline (Tinder Cards)
**Files:**
- Create: `frontend/src/pages/founder/ProjectApplications.jsx`
- Create: `frontend/src/components/founder/ApplicantCard.jsx`

**Interfaces:**
- Consumes: `GET /founder/projects/:id/applicants`
- Consumes: `POST /founder/projects/:id/applicants/:id/action`

- [ ] **Step 1: Implement `ApplicantCard` with Framer Motion animations**
- [ ] **Step 2: Implement `ProjectApplications` page logic**
  - Manage card stack state
  - Handle Right/Left/Down swipes
- [ ] **Step 3: Wire actions to API**
- [ ] **Step 4: Commit**

### Task 9: The Execution Board (Kanban)
**Files:**
- Create: `frontend/src/pages/founder/ProjectTasks.jsx`
- Create: `frontend/src/components/founder/KanbanBoard.jsx`

**Interfaces:**
- Consumes: `GET /projects/:id/tasks`
- Consumes: `PATCH /projects/:id/tasks/:id` (status update)

- [ ] **Step 1: Implement `KanbanBoard` layout (4 columns)**
- [ ] **Step 2: Implement drag-and-drop functionality**
- [ ] **Step 3: Implement Optimistic Updates for status changes**
- [ ] **Step 4: Commit**

### Task 10: The Review Side-Drawer
**Files:**
- Create: `frontend/src/components/founder/ReviewDrawer.jsx`
- Modify: `frontend/src/pages/founder/ProjectTasks.jsx`

**Interfaces:**
- Consumes: `POST /founder/projects/:id/tasks/:id/review`

- [ ] **Step 1: Implement `ReviewDrawer` UI**
  - Show task updates/comments
  - Render "Approve" and "Request Changes" buttons
- [ ] **Step 2: Wire "Request Changes" to mandatory comment box**
- [ ] **Step 3: Wire "Approve" to API**
- [ ] **Step 4: Commit**

### Task 11: Team & Settings Pages
**Files:**
- Create: `frontend/src/pages/founder/ProjectTeam.jsx`
- Create: `frontend/src/pages/founder/ProjectSettings.jsx`

- [ ] **Step 1: Implement `ProjectTeam` (Member list + Role management)**
- [ ] **Step 2: Implement `ProjectSettings` (Status transitions + Metadata)**
- [ ] **Step 3: Verify permissions and API calls**
- [ ] **Step 4: Commit**

### Task 12: The "Super-View" Integration
**Files:**
- Modify: `frontend/src/pages/ProjectDetail.jsx` (or equivalent)
- Modify: `frontend/src/components/ProjectNavigation.jsx`

- [ ] **Step 1: Add "Manage Project" button to Project View**
- [ ] **Step 2: Update Member-view navigation to show Admin links if `is_lead`**
- [ ] **Step 3: Verify seamless transition between `/projects` and `/founder`**
- [ ] **Step 4: Commit**

### Task 13: Final E2E Verification
- [ ] **Step 1: Test Flow: Signup $\rightarrow$ Create Project $\rightarrow$ Recruit Applicant $\rightarrow$ Accept $\rightarrow$ Assign Task $\rightarrow$ Review $\rightarrow$ Approve $\rightarrow$ Complete Project.**
- [ ] **Step 2: Verify that non-admins cannot access `/founder` routes.**
- [ ] **Step 3: Final polish on animations and empty states.**
- [ ] **Step 4: Final Commit.**
