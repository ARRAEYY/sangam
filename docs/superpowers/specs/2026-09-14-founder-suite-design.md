# Design Spec: Sangam Founder Suite (The "Super-View")

**Date:** 2026-09-14
**Status:** Draft for Review
**Path:** Architectural

---

## 1. Executive Summary
The Founder Suite is a dedicated "Command Center" for project owners and admins. It transforms the project management experience from passive tracking to active decision-making. The core philosophy is **High Velocity**: reducing the friction between identifying a problem (e.g., a blocked task or a new applicant) and taking an action.

The suite is implemented as a "Super-View"—a high-privilege workspace that incorporates all member-level functionality while adding powerful administrative tools, ensuring that admins never have to switch contexts to see what their team sees.

---

## 2. Information Architecture & Routing

### 2.1 Routing Map (Namespace: `/founder`)
The Founder Suite exists in a dedicated namespace to provide a clear mental shift for the user.

| Route | Page | Primary Purpose |
| :--- | :--- | :--- |
| `/founder` | **Founder Hub** | Global overview of all owned projects and aggregated alerts. |
| `/founder/projects/:id/overview` | **Attention Center** | Action-oriented "Good Morning" page. Decision-based alerts. |
| `/founder/projects/:id/tasks` | **Execution Board** | Kanban board for all project tasks. |
| `/founder/projects/:id/applications` | **Recruiting Pipeline** | Tinder-style card review for applicants. |
| `/founder/projects/:id/team` | **Team Roster** | Membership management, role assignment, and ownership transfer. |
| `/founder/projects/:id/settings` | **Project Config** | Project metadata, status transitions, and visibility. |

### 2.2 Access Control
*   **Frontend Guard:** A `FounderGuard` HOC wraps all `/founder` routes, verifying the user's `ProjectMember.is_lead` status or `Project.owner_id` before rendering.
*   **Mode Switch:** A "Manage Project" button is added to the standard `/projects/:id` view (visible only to admins), providing a direct teleport to the Founder Suite.

---

## 3. User Experience & UI Components

### 3.1 The Attention Center (`/overview`)
Moves away from traditional dashboards toward a **Decision List**.
*   **Action Cards:** High-priority cards grouped by type (e.g., "Needs Review", "Blocked", "Pending Applicants").
*   **Contextual Actions:** Each card contains a direct action button (e.g., "Review Now", "Message Member").
*   **Health State:** Displays a "Project Health" summary when no urgent actions are pending.

### 3.2 The Execution Board (`/tasks`)
A high-fidelity Kanban implementation.
*   **Columns:** `Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Ready for Review` $\rightarrow$ `Completed`.
*   **The Review Pulse:** The `Ready for Review` column is visually emphasized to draw the founder's attention.
*   **Admin-Enhanced Cards:** Task cards include an "Admin Ribbon" and a "Quick Move" menu for forced status overrides or reassignments.
*   **Review Side-Drawer:** Clicking a task in the review column opens a drawer showing the member's updates and the **Approval Panel** (`Approve & Complete` | `Request Changes`).

### 3.3 The Recruiting Pipeline (`/applications`)
A high-velocity Tinder-style card interaction.
*   **The Card:** Centered profile showing name, avatar, matched skill badges (green), bio, and application message.
*   **Gestures/Actions:**
    *   **Right/Accept:** Atomically adds user to team and increments role count.
    *   **Left/Reject:** Archives application.
    *   **Down/Shortlist:** Marks for later review.
*   **Animations:** Framer Motion used for card slides and "Welcome" transitions upon acceptance.

### 3.4 General Design Language
*   **Power Mode Accents:** Use of high-contrast accents (Deep Indigo/Gold) to distinguish the Founder Suite from the Member view.
*   **Super-View Logic:** All member-level views (Discussion, Files) are embedded within the Founder Suite, but enhanced with admin moderation tools (e.g., "Pin", "Delete").

---

## 4. Technical Architecture

### 4.1 API Design (Command Pattern)
Specialized "Power" endpoints to replace generic mutations.

| Endpoint | Method | Action | Description |
| :--- | :--- | :--- | :--- |
| `/founder/projects/:id/attention` | `GET` | `FETCH_ALERTS` | Returns aggregated alerts for the Attention Center. |
| `/founder/projects/:id/applicants/:id/action` | `POST` | `PROCESS_APP` | Handles `ACCEPT`, `REJECT`, `SHORTLIST` atomically. |
| `/founder/projects/:id/tasks/:id/review` | `POST` | `REVIEW_TASK` | Handles `APPROVE` or `REQUEST_CHANGES` (requires comment). |
| `/founder/projects/:id/tasks` | `POST` | `CREATE_TASK` | Admin-only task creation. |

### 4.2 Backend Security
*   **Middleware:** Every `/founder` API endpoint is protected by `checkProjectLead` middleware.
*   **Atomic Transitions:** The `ACCEPT` applicant action is wrapped in a database transaction to ensure `ProjectMember` creation and `ProjectRole` count increments happen together.

### 4.3 Frontend State Management
*   **Optimistic Updates:** Kanban drag-and-drop and application actions use optimistic state updates with automatic rollback on API failure.
*   **Role-Aware Components:** Components take a `viewerRole` prop to conditionally render admin controls (e.g., the "Approve" button).

---

## 5. Success Criteria (Definition of Done)
1.  **Founder can enter the suite** from the project page via "Manage Project".
2.  **Founder can process an applicant** via the Tinder cards and see them appear in the Team roster immediately.
3.  **Founder can approve a task** via the Review Drawer, moving it to "Completed" and logging the contribution.
4.  **The Attention Center** correctly surfaces pending reviews and blocked tasks from seeded data.
5.  **Unauthorized users** are blocked from all `/founder` routes and API endpoints.
