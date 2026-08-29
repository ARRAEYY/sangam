# Sangam Frontend — Developer Reference

> Read CONTEXT.md at the repo root first for the full project overview. This file has frontend-specific deep dives.

## Running Locally

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Runs on http://localhost:5173.

## Project Structure

```
src/
├── main.jsx          ← React entry. Wraps BrowserRouter + AuthProvider.
├── App.jsx           ← All routes + authenticated shell layout.
├── api.js            ← Single source of truth for ALL API calls.
├── index.css         ← Global CSS + design tokens.
├── context/
│   └── AuthContext.jsx
├── components/       ← Shared/reusable components.
└── pages/            ← One file per route.
```

## API Layer (src/api.js)

Single `request()` function wraps all fetch calls:
- Builds the full URL from VITE_API_URL + path.
- Adds CSRF-Token header automatically for POST/PUT/PATCH/DELETE.
- Sets credentials: "include" on every request (cookie auth).
- On 401: silently calls /api/auth/refresh and retries once.
- On error: throws an Error with error.status and error.data attached.

The exported `api` object has a named method for every endpoint. Always use `api.*` — never call `fetch()` directly.

## Auth State (AuthContext.jsx)

```jsx
const { user, loading, login, loginWithGoogle, register, logout, refreshProfile } = useAuth()
```

- `user`: null (logged out / loading) or the serialized user object.
- `loading`: true until the initial profile fetch resolves.
- Never access user fields without checking `user !== null`.
- `refreshProfile()`: re-fetches the profile to sync state after profile updates.

## Protected Routes

Wrap any authenticated page with `<ProtectedRoute>`:
```jsx
<Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
```

ProtectedRoute redirects to /auth if user is null (and loading is false).

## Application Shell Layout

App.jsx renders:
```
<div flex flex-col min-h-[100dvh]>
  <Navbar />                        ← sticky, z-30, always visible
  <div flex flex-1 w-full>
    {inAppShell && (
      <div w-[92px] shrink-0>       ← sidebar gutter (desktop only)
        <Sidebar />                  ← fixed position, overlays content on hover
      </div>
    )}
    <main flex-1 mx-auto max-w-5xl> ← main content
      <Routes>...</Routes>
    </main>
  </div>
  {inAppShell && <MobileBottomNav />}
</div>
```

Routes without the shell (NO_SHELL_PATHS): /, /auth, /onboarding, /reset-password.

## Sidebar Rules (DO NOT BREAK)

1. `position: fixed; left: 20px; top: 64px; height: calc(100vh - 64px)` — never moves.
2. Collapsed: 72px wide, icon only, centered.
3. Hover: expands to 240px via `absolute` overlay — does NOT reflow the page.
4. Labels: `opacity-0 w-0 -translate-x-2` → `opacity-100 w-auto translate-x-0` on group-hover.
5. Active item: only the 44x44 icon div gets `bg-brand-600 text-white`.
6. Logout: `mt-auto` pins it to the bottom of the flex column.
7. No card/shadow/border on the sidebar container.
8. App shell gutter is `w-[92px] shrink-0` — a static spacer.

## Design Tokens

```css
:root {
  --color-primary: #a5002c;      /* Deep maroon — brand accent */
  --color-background: #f7f6f3;   /* Warm cream — page bg */
  --color-card: #FFFFFF;
  --color-muted: #f8fafc;
  --color-border: #f1f5f9;
  --radius-card: 16px;
  --radius-chip: 9999px;
}
```

In Tailwind:
- `bg-brand-600` → #a5002c (primary maroon)
- `bg-cream-100` → #f7f6f3 (page background)
- `text-brand-700` → #800023 (darker maroon for active states)

## Utility Classes (index.css)

| Class | Use |
|---|---|
| `.input` | Standard text input |
| `.card` | White card, soft shadow, rounded-2xl |
| `.btn-primary` | Filled maroon button, rounded-full |
| `.btn-secondary` | Outlined white button |
| `.btn-ghost` | Ghost/transparent button |
| `.pill` | Small chip/tag |
| `.icon-nav-btn` | 44px square icon button for nav |

## Talent Card Rules (TalentSearch.jsx)

1. Grid: 3 columns desktop, 2 columns tablet, 1 column mobile.
2. Each card: `flex flex-col h-full`.
3. Bio: `min-h-[40px]`, only rendered if bio exists — NO placeholder text.
4. Skills: `h-[52px] overflow-hidden`, max 4 pills + +N chip.
5. Footer (social icons + Connect): `mt-auto` to bottom-align across the row.
6. Name: `line-clamp-1`. Bio: `line-clamp-2`. Education: `line-clamp-1`.

## Key Components

### Navbar.jsx
- Sticky, z-30, white/translucent background.
- Shows: Sangam logo, NotificationBell (auth only), profile dropdown (auth only), hamburger (mobile).
- Profile dropdown: link to /dashboard, logout button.
- Mobile: renders a slide-in drawer (via React portal to escape backdrop-filter context).

### Skeletons.jsx
- Exports: ProjectCardSkeleton, TalentCardSkeleton, NotificationSkeleton, etc.
- Use these during API loading states. Never show empty pages during load.

### NotificationBell.jsx
- Polls unread count every 15 seconds.
- Shows red badge with count when unread > 0.

### GoogleSignInButton.jsx
- Renders Google Identity Services button.
- On success, calls api.loginWithGoogle(credential) then navigates.
- Requires VITE_GOOGLE_CLIENT_ID to be set.

### SkillTagInput.jsx
- Chip input for adding skills.
- Press Enter or comma to add a tag.

## Fonts

Both fonts are loaded from Google Fonts in index.html:
- Inter: 400, 500, 600, 700
- Fraunces: 400, 600, 700 (display/headings)

## Build

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Production build is deployed to Vercel automatically from the main branch.
vercel.json rewrites all paths to /index.html for client-side routing.
