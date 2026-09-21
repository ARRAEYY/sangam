# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Founder Suite from a separate `/founder` namespace to a nested `/projects/:id/manage` workspace, and rebuild the task system as a Notion-style flexible database.

**Architecture:**
1. **Backend**: Move `/api/founder` endpoints to `/api/projects/:id/manage`. Add JSONB columns for custom property values (Milestone) and property definitions (Project).
2. **Frontend Routing**: Implement a `ManageGuard` for `/projects/:id/manage/*` based on Project Owner/Lead status.
3. **UI**: Replace the fixed Kanban with a multi-view (Table, Board, Calendar, List) Task Workspace and a high-velocity Admin Dashboard.

**Tech Stack:** React, React-Router, Node.js, Express, Sequelize (PostgreSQL), Framer Motion.

**Spec:** `docs/superpowers/specs/2026-09-16-admin-dashboard-design.md`

## Global Constraints
- **Route Structure**: All admin pages MUST live under `/projects/:id/manage/*`.
- **Authorization**: Only Project Owners or members with `is_lead: true` can access `/manage/*` routes.
- **Task Pipeline**: Statuses `Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Ready for Review` $\rightarrow$ `Completed` must remain fixed.
- **Custom Properties**: Stored in a GIN-indexed JSONB column on the Milestone model.
- **Migration**: Completely remove all references to `/founder` namespace.

---

### Task 1: Database Schema Update (Custom Properties)

**Files:**
- Modify: `backend/src/models/milestone.js` (or equivalent)
- Modify: `backend/src/models/project.js` (or equivalent)
- Create: `backend/src/migrations/[timestamp]-add-custom-properties.js`

**Interfaces:**
- Produces: `Milestone.custom_properties` (JSONB), `Project.property_schema` (JSONB).

- [ ] **Step 1: Create migration to add `custom_properties` (JSONB) to Milestones with GIN index.**
- [ ] **Step 2: Create migration to add `property_schema` (JSONB) to Projects.**
- [ ] **Step 3: Run migrations.**
- [ ] **Step 4: Verify schema changes via DB tool or simple script.**
- [ ] **Step 5: Commit.**

### Task 2: Backend Route Migration & Auth Refactor

**Files:**
- Modify: `backend/src/middleware/founderAuth.js` $\rightarrow$ Rename to `backend/src/middleware/adminAuth.js`
- Modify: `backend/src/routes/founder.js` $\rightarrow$ Move to `backend/src/routes/admin.js`
- Modify: `backend/src/server.js`

**Interfaces:**
- Consumes: `requireAuth`
- Produces: `ManageGuard` (Express middleware checking `Project.owner_id` or `ProjectMember.is_lead`).

- [ ] **Step 1: Refactor `founderAuth.js` to `adminAuth.js`. Update `FounderGuard` to `ManageGuard`.**
- [ ] **Step 2: Migrate all routes in `founder.js` to `admin.js`, changing paths from `/api/founder/projects/:id/...` to `/api/projects/:id/manage/...`.**
- [ ] **Step 3: Update `backend/src/server.js` to mount `adminRoutes` at `/api/projects/:id/manage`.**
- [ ] **Step 4: Test one endpoint (e.g., GET /api/projects/:id/manage/attention) via curl.**
- [ ] **Step 5: Commit.**

### Task 3: Frontend API & Routing Migration

**Files:**
- Modify: `frontend/src/api.js`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/ProjectNavigation.jsx`
- Modify: `frontend/src/components/ProjectDetailModal.jsx`

**Interfaces:**
- Consumes: `api.getProjectContext` (to check if user is lead/owner).
- Produces: New route structure `/projects/:id/manage/*`.

- [ ] **Step 1: Update `api.js` to replace all `/api/founder` calls with `/api/projects/:id/manage`.**
- [ ] **Step 2: In `App.jsx`, remove all `/founder` routes.**
- [ ] **Step 3: Implement `ManageGuard` component in `App.jsx` (or separate file) that checks Project lead/owner status before rendering children.**
- [ ] **Step 4: Add new routes under `/projects/:id/manage` for Dashboard, Tasks, Applications, Team, and Settings.**
- [ ] **Step 5: Update `ProjectNavigation.jsx` and `ProjectDetailModal.jsx` to link to new paths.**
- [ ] **Step 6: Verify routing by navigating to `/projects/[id]/manage` in browser.**
- [ ] **Step 7: Commit.**

### Task 4: Recruiting Pipeline Migration

**Files:**
- Modify: `frontend/src/pages/founder/ProjectApplications.jsx` $\rightarrow$ `frontend/src/pages/manage/RecruitingPipeline.jsx`
- Modify: `frontend/src/components/founder/ApplicantCard.jsx` $\rightarrow$ `frontend/src/components/manage/ApplicantCard.jsx`

**Interfaces:**
- Consumes: `api.getFounderApplicants`, `api.applicantAction`.

- [ ] **Step 1: Move and rename files to the new `manage/` directory.**
- [ ] **Step 2: Update internal links (e.g., "Back to Projects" button) to the new route structure.**
- [ ] **Step 3: Verify that swipe actions still trigger the correct backend API.**
- [ ] **Step 4: Commit.**

### Task 5: Team Roster & Project Settings Migration

**Files:**
- Modify: `frontend/src/pages/founder/ProjectTeam.jsx` $\rightarrow$ `frontend/src/pages/manage/TeamRoster.jsx`
- Modify: `frontend/src/pages/founder/ProjectSettings.jsx` $\rightarrow$ `frontend/src/pages/manage/ProjectSettings.jsx`

**Interfaces:**
- Consumes: `api.getMembers`, `api.removeMember`, `api.updateMemberRole`.

- [ ] **Step 1: Move and rename files to the new `manage/` directory.**
- [ ] **Step 2: Update `TeamRoster.jsx` to include the "Shortlisted" tab (filter members by application status).**
- [ ] **Step 3: Update `ProjectSettings.jsx` to include a UI for managing the `property_schema` (adding/removing custom task property definitions).**
- [ ] **Step 4: Commit.**

### Task 6: Admin Dashboard Implementation

**Files:**
- Create: `frontend/src/pages/manage/AdminDashboard.jsx`

**Interfaces:**
- Consumes: `api.getProjectAttention` (migrated to `/api/projects/:id/manage/attention`).

- [ ] **Step 1: Implement Header Strip with project stats (Completion %, Active Members, Open Applicants).**
- [ ] **Step 2: Implement the "Decision Queue" (Attention Center) using the `alerts` array from the API.**
- [ ] **Step 3: Implement a simple "Activity Feed" (mocked if backend log doesn't exist, or use recent milestone updates).**
- [ ] **Step 4: Implement Quick Link cards to other manage subpages.**
- [ ] **Step 5: Commit.**

### Task 7: Notion-Style Task Workspace (Core)

**Files:**
- Create: `frontend/src/pages/manage/TaskWorkspace.jsx`
- Create: `frontend/src/components/manage/TaskViewSwitcher.jsx`
- Create: `frontend/src/components/manage/TaskTableView.jsx`
- Create: `frontend/src/components/manage/TaskBoardView.jsx`

**Interfaces:**
- Consumes: `api.getMilestones`, `api.updateMilestone`.
- Produces: State management for current view (Table/Board/Calendar/List) and active filters.

- [ ] **Step 1: Implement the `TaskViewSwitcher` (Tabs for Board, Table, Calendar, List).**
- [ ] **Step 2: Implement `TaskTableView` with sortable columns and inline-editable cells for both fixed and custom properties.**
- [ ] **Step 3: Implement `TaskBoardView` (Kanban) grouped by status (fixed) or custom properties.**
- [ ] **Step 4: Implement logic to handle "Custom Property" inputs based on the `property_schema` from the Project model.**
- [ ] **Step 5: Commit.**

### Task 8: Task Detail Page & Approval Workflow

**Files:**
- Create: `frontend/src/components/manage/TaskDetailPage.jsx`

**Interfaces:**
- Consumes: `api.updateMilestone`, `api.reviewTask`.

- [ ] **Step 1: Implement the full-page detail view with a property sidebar.**
- [ ] **Step 2: Implement the "Approval Panel" (only visible to Lead/Owner when status is `READY_FOR_REVIEW`).**
- [ ] **Step 3: Connect "Approve" button to the backend `review` endpoint to move task to `COMPLETED`.**
- [ ] **Step 4: Connect "Request Changes" button to trigger the feedback modal and move task to `IN_PROGRESS`.**
- [ ] **Step 5: Commit.**

### Task 9: Cleanup & Final Verification

**Files:**
- Delete: `frontend/src/pages/founder/*`
- Delete: `frontend/src/components/founder/*`
- Delete: `backend/src/routes/founder.js`

- [ ] **Step 1: Remove all legacy `/founder` files and directories.**
- [ ] **Step 2: Run a full search for "founder" in the codebase to ensure no leaked references remain.**
- [ ] **Step 3: Verify all "Manage" tab routes are accessible only to leads/owners.**
- [ ] **Step 4: Final end-to-end test: Accept applicant $\rightarrow$ Create Task $\rightarrow$ Set Custom Prop $\rightarrow$ Move to Review $\rightarrow$ Approve.**
- [ ] **Step 5: Final Commit.**
