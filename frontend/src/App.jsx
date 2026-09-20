import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import MobileBottomNav from './components/MobileBottomNav.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import FounderGuard from './components/auth/FounderGuard.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Onboarding from './pages/Onboarding.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Explore from './pages/Explore.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import CreateProject from './pages/CreateProject.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import TalentSearch from './pages/TalentSearch.jsx'
import Notifications from './pages/Notifications.jsx'
import Applications from './pages/Applications.jsx'
import Connections from './pages/Connections.jsx'
import FounderHub from './pages/founder/FounderHub.jsx'
import ProjectOverview from './pages/founder/ProjectOverview.jsx'
import ProjectTasks from './pages/founder/ProjectTasks.jsx'
import ProjectApplications from './pages/founder/ProjectApplications.jsx'
import ProjectTeam from './pages/founder/ProjectTeam.jsx'
import ProjectSettings from './pages/founder/ProjectSettings.jsx'
import ProjectMilestones from './pages/founder/ProjectMilestones.jsx'
import ProjectHiring from './pages/founder/ProjectHiring.jsx'
import ProjectAnalytics from './pages/founder/ProjectAnalytics.jsx'

// Landing, Auth, and ResetPassword are full-bleed marketing/entry screens; every other
// route lives inside the app shell with the floating icon sidebar on desktop
// and bottom navigation on mobile. Founder workspace pages handle their own layout.
const NO_SHELL_PATHS = ['/', '/auth', '/onboarding', '/reset-password']

export default function App() {
  const location = useLocation()
  const isFounderWorkspace = location.pathname.startsWith('/founder')
  const hasGlobalNavbar = !NO_SHELL_PATHS.includes(location.pathname)
  const hasGlobalSidebar = hasGlobalNavbar && !isFounderWorkspace

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden antialiased">
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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
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
            <Route path="/founder/projects/:id/overview" element={<FounderGuard><ProjectOverview /></FounderGuard>} />
            <Route path="/founder/projects/:id/tasks" element={<FounderGuard><ProjectTasks /></FounderGuard>} />
            <Route path="/founder/projects/:id/milestones" element={<FounderGuard><ProjectMilestones /></FounderGuard>} />
            <Route path="/founder/projects/:id/team" element={<FounderGuard><ProjectTeam /></FounderGuard>} />
            <Route path="/founder/projects/:id/hiring" element={<FounderGuard><ProjectHiring /></FounderGuard>} />
            <Route path="/founder/projects/:id/applications" element={<FounderGuard><ProjectApplications /></FounderGuard>} />
            <Route path="/founder/projects/:id/settings" element={<FounderGuard><ProjectSettings /></FounderGuard>} />
            <Route path="/founder/projects/:id/analytics" element={<FounderGuard><ProjectAnalytics /></FounderGuard>} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar on mobile screens */}
      {hasGlobalSidebar && <MobileBottomNav />}
    </div>
  )
}
