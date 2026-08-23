import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import MobileBottomNav from './components/MobileBottomNav.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Explore from './pages/Explore.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import CreateProject from './pages/CreateProject.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TalentSearch from './pages/TalentSearch.jsx'
import Notifications from './pages/Notifications.jsx'

// Landing and Auth are full-bleed marketing/entry screens; every other
// route lives inside the app shell with the floating icon sidebar on desktop
// and bottom navigation on mobile.
const NO_SHELL_PATHS = ['/', '/auth']

export default function App() {
  const location = useLocation()
  const inAppShell = !NO_SHELL_PATHS.includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-cream-100 text-slate-900 antialiased">
      <Navbar />
      <main
        className={`flex-1 ${
          inAppShell
            ? 'mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:pb-16 sm:pt-6 md:flex md:gap-6'
            : 'w-full'
        }`}
      >
        {inAppShell && <Sidebar />}
        <div className="min-w-0 flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/talent" element={<TalentSearch />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar on mobile screens */}
      {inAppShell && <MobileBottomNav />}
    </div>
  )
}
