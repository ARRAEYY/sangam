# Admin Dashboard Design — Sangam Project Owner Workspace

**Derived from:** Design Spec: Sangam Founder Suite (2026-09-14) + revisions
**Scope:** UI/UX design for the project owner's admin experience, restructured as a nested subpage of the project (not a separate namespace), with the task system rebuilt as a Notion-style workspace.

---

## 1. Design Goal

The admin dashboard is where the **project owner** manages everything about their project from one continuous workspace — not a separate "mode" they teleport into. Members and owners live in the same project; the owner just sees more.

Two design instincts are balanced here:
- **High Velocity** (from the original spec) — the owner should see what needs a decision and act on it in one click.
- **Workspace flexibility** (Notion-style) — the underlying data (tasks especially) should be viewable, filterable, and editable in whatever shape the owner wants, not locked into one fixed layout.

Resolution: the **Dashboard** is the decision-first front door (fast, opinionated, action-oriented). The **Tasks** area underneath it is the flexible workspace (slow-cook, exploratory, database-like). The owner lands on the fast page and drops into the flexible one when they need to actually dig in.

---

## 2. Routing — Nested, Not Separate

No more `/founder` namespace. The admin experience is a subpage of the project itself:

| Route | Page | Visible to |
| :--- | :--- | :--- |
| `/projects/:id` | Project Home (member view) | Everyone on the project |
| `/projects/:id/manage` | **Admin Dashboard** | Owner / lead only |
| `/projects/:id/manage/tasks` | **Task Workspace** | Owner / lead only |
| `/projects/:id/manage/applications` | **Recruiting Pipeline** | Owner / lead only |
| `/projects/:id/manage/team` | **Team Roster** | Owner / lead only |
| `/projects/:id/manage/settings` | **Project Settings** | Owner / lead only |

- A **"Manage"** tab appears in the project's normal tab bar (alongside Discussion, Files, etc.) — visible only when `Project.owner_id === currentUser.id` or `ProjectMember.is_lead === true`. No separate teleport button, no "Exit to Member View" — it's just another tab, because it's the same workspace.
- `ManageGuard` (route-level) checks ownership/lead status before rendering any `/manage/*` page; unauthorized visits simply don't show the tab and 403/redirect if hit directly.
- Visual identity: the Manage tabs get a subtle accent (not a full theme change) — enough to signal "you're in the owner's view" withoutして it feel like a different app.

---

## 3. Admin Dashboard — `/projects/:id/manage`

This is the landing page and the one page every owner should be able to scan in 10 seconds. Layout, top to bottom:

### 3.1 Header Strip
Project name, status pill (Active/Archived), and three at-a-glance stats: **task completion %**, **active members**, **open applicants**.

### 3.2 Decision Queue (the old "Attention Center," folded in here)
The core of the dashboard — grouped Action Cards, ordered by urgency:
1. Pending Applicants
2. Tasks Awaiting Review
3. Blocked Tasks

Each card: one-line context, timestamp, single primary action (`Review Now`, `Message Member`). This section is intentionally NOT a table — it's a queue you clear, not data you browse.

**Empty state:** replaced by a calm "Project Health" summary (completion trend, recent activity) when there's nothing pending — the dashboard should never look broken just because there's nothing to do.

### 3.3 Activity Feed
Compact, scrollable log of recent events across the project — tasks completed, members joined, applications received. Gives the owner ambient awareness without needing to visit each subpage.

### 3.4 Quick Links
Four cards linking into Tasks / Team / Applications / Settings — each showing a small live count (e.g. "Tasks — 4 in review").

---

## 4. Task Workspace — `/projects/:id/manage/tasks`

This replaces the fixed 4-column Kanban with a proper **task database**, Notion-style. Status stays a fixed, structured pipeline (it powers the review-approval workflow); everything else about how tasks are viewed and organized is flexible.

### 4.1 Fixed Pipeline (unchanged from original spec)
`Todo` → `In Progress` → `Ready for Review` → `Completed`
Kept fixed and non-editable because the Approve / Request Changes workflow depends on `Ready for Review` as a real gate, not just a label.

### 4.2 View Switcher
Tabs at the top of the workspace, all reading the same underlying task set:
- **Board** — Kanban, grouped by status by default, but groupable by any property (assignee, tag, priority).
- **Table** — spreadsheet-style rows, sortable/filterable columns, inline-editable cells.
- **Calendar** — tasks plotted by due date.
- **List** — flat, groupable list for quick scanning.

### 4.3 Custom Properties
Owner can add/remove properties per project via a "+ Property" control on the Table view — Priority, Due Date, Tags, Effort, or custom select fields. Built-in properties (Status, Assignee) can't be removed; custom ones can be reordered or deleted.

### 4.4 Filtering, Sorting, Grouping
First-class controls on every view (a filter bar above Board/Table/List, e.g. "Assignee = me," "Priority = High," "Due this week"). Grouping applies to Board columns and List sections alike — group by Status (default), or by any other property.

### 4.5 Task Detail Page (replaces the side-drawer)
Clicking any task opens a **full page**, not a drawer:
- Property sidebar (status, assignee, all custom properties — inline editable)
- Block-style description body
- Sub-tasks
- Comments / activity log
- Linked files
- **Approval Panel** (only when status = Ready for Review, only visible to owner/lead): `Approve & Complete` | `Request Changes` (requires a comment).

### 4.6 Inline Editing
Every property, on every view, is click-to-edit — no modals. Table cells, Board card properties, and the detail-page sidebar all behave the same way.

### 4.7 Task Creation
"+ New Task" available from any view (Board, Table, List), owner/lead only.

---

## 5. Recruiting Pipeline — `/projects/:id/manage/applications`

Unchanged in spirit from the original spec — this stays fast and decision-first, deliberately not "Notion-ified," because triaging applicants is a queue-clearing task, not a database task.

- Swipeable card stack: avatar, name, matched-skill badges, bio, application message.
- Right/Accept → adds to team, increments role count (atomic backend transaction).
- Left/Reject → archives.
- Down/Shortlist → moves to a "Shortlisted" tray, later promoted from the Team Roster.
- Explicit button fallbacks below the card for non-gesture use.
- Framer Motion slide + "Welcome" transition on Accept.

---

## 6. Team Roster — `/projects/:id/manage/team`

- List/table of members: avatar, name, role, join date, status — inline-editable role field.
- Row actions: change role, remove member, transfer ownership (confirmation modal, given irreversibility).
- "Shortlisted" tab for applicants held back from the Recruiting Pipeline.

---

## 7. Project Settings — `/projects/:id/manage/settings`

- Metadata (name, description), visibility toggle, status transitions (Active → Archived, confirmed).
- Custom task properties defined in Section 4.3 can also be managed here as a project-level schema list, for owners who prefer configuring structure outside the Task Workspace itself.
- Destructive actions separated at the bottom with distinct visual weight.

---

## 8. Role-Aware Component Behavior

| Component | Owner/Lead View | Member View |
| :--- | :--- | :--- |
| Task Card / Row | Admin ribbon, Quick Move, full property editing | Can edit own assigned task's status/notes only |
| Task Detail Page | Approval Panel visible when Ready for Review | No approval controls, even on own task |
| Discussion / Files (shared with member view) | Pin / Delete moderation controls added inline | Standard controls only |
| Manage tab | Visible | Hidden entirely |

---

## 9. States to Design For

- **Loading:** Skeletons for Dashboard cards and Task Workspace views (avoid spinners for list/board-shaped content).
- **Empty:** Dashboard → Project Health summary; Task Workspace → "No tasks yet, create one"; Applications → "No pending applicants."
- **Error/Rollback:** Optimistic edits (drag-drop, inline edits) revert + toast on failure.
- **Unauthorized:** Manage tab simply isn't rendered; direct URL hits redirect, no flash of admin chrome.

---

## 10. Success Criteria

1. Project owner sees a **Manage** tab on their own projects; members never see it.
2. Dashboard surfaces pending applicants, awaiting-review tasks, and blocked tasks correctly from seeded data.
3. Task Workspace supports switching between Board/Table/Calendar/List on the same task set, with custom properties persisting across views.
4. Approving a task from its detail page moves it to Completed and logs the contribution.
5. Accepting an applicant via the pipeline adds them to the Team Roster without a manual refresh.
