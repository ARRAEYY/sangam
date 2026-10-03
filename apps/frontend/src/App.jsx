import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MobileBottomNav from './components/layout/MobileBottomNav.jsx'
import GlobalGrid from './components/layout/GlobalGrid.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import FounderGuard from './components/auth/FounderGuard.jsx'
import WorkspaceGuard from './components/auth/WorkspaceGuard.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'

// Route-level code splitting: only Landing and Auth stay in the initial
// bundle (anonymous/marketing traffic never downloads workspace code).
// Heavy founder workspace, profile editing, and creation pages load on demand.
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail.jsx'))
const CreateProject = lazy(() => import('./pages/CreateProject.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const TalentSearch = lazy(() => import('./pages/TalentSearch.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const Applications = lazy(() => import('./pages/Applications.jsx'))
const Connections = lazy(() => import('./pages/Connections.jsx'))
const FounderHub = lazy(() => import('./pages/founder/FounderHub.jsx'))
const ProjectOverview = lazy(() => import('./pages/founder/ProjectOverview.jsx'))
const ProjectTasks = lazy(() => import('./pages/founder/ProjectTasks.jsx'))
const ProjectApplications = lazy(() => import('./pages/founder/ProjectApplications.jsx'))
const ProjectTeam = lazy(() => import('./pages/founder/ProjectTeam.jsx'))
const ProjectSettings = lazy(() => import('./pages/founder/ProjectSettings.jsx'))
const ProjectMilestones = lazy(() => import('./pages/founder/ProjectMilestones.jsx'))
const ProjectHiring = lazy(() => import('./pages/founder/ProjectHiring.jsx'))
const ProjectAnalytics = lazy(() => import('./pages/founder/ProjectAnalytics.jsx'))

// Landing, Auth, and ResetPassword are full-bleed marketing/entry screens; every other
// route lives inside the app shell with the floating icon sidebar on desktop
// and bottom navigation on mobile. Founder workspace pages handle their own layout.
const NO_SHELL_PATHS = ['/', '/auth', '/onboarding', '/verify-email', '/reset-password']

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading page">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-[#800023] animate-spin" />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isFounderWorkspace = location.pathname.startsWith('/founder') || location.pathname.startsWith('/workspace')
  const hasGlobalNavbar = !NO_SHELL_PATHS.includes(location.pathname)
  const hasGlobalSidebar = hasGlobalNavbar && !isFounderWorkspace

  return (
    <div className="flex min-h-[100dvh] flex-col antialiased">
      {hasGlobalNavbar && <GlobalGrid />}
      {hasGlobalNavbar && <Navbar />}

      <div className="flex flex-1 w-full relative">
        {/* Fixed position sidebar */}
        {hasGlobalSidebar && <Sidebar />}

        {/* Main Content Area */}
        <main
          className={`flex-1 min-w-0 ${hasGlobalSidebar
            ? 'app-canvas px-5 pb-24 pt-4 sm:px-6 sm:pb-16 sm:pt-6 w-full'
            : 'w-full'
            }`}
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/talent" element={<ProtectedRoute><TalentSearch /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/projects/:id/edit" element={<ProtectedRoute><CreateProject mode="edit" /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateProject mode="create" /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/founder" element={<FounderGuard><FounderHub /></FounderGuard>} />
              <Route path="/workspace/:id/overview" element={<WorkspaceGuard><ProjectOverview /></WorkspaceGuard>} />
              <Route path="/workspace/:id/tasks" element={<WorkspaceGuard><ProjectTasks /></WorkspaceGuard>} />
              <Route path="/workspace/:id/milestones" element={<WorkspaceGuard><ProjectMilestones /></WorkspaceGuard>} />
              <Route path="/workspace/:id/team" element={<WorkspaceGuard><ProjectTeam /></WorkspaceGuard>} />
              <Route path="/workspace/:id/hiring" element={<WorkspaceGuard><ProjectHiring /></WorkspaceGuard>} />
              <Route path="/workspace/:id/applications" element={<WorkspaceGuard><ProjectApplications /></WorkspaceGuard>} />
              <Route path="/workspace/:id/settings" element={<WorkspaceGuard><ProjectSettings /></WorkspaceGuard>} />
              <Route path="/workspace/:id/analytics" element={<WorkspaceGuard><ProjectAnalytics /></WorkspaceGuard>} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar on mobile screens */}
      {hasGlobalSidebar && <MobileBottomNav />}
    </div>
  )
}
