import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
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
// route lives inside the app shell with the floating icon sidebar.
const NO_SIDEBAR_PATHS = ['/', '/auth']

export default function App() {
  const location = useLocation()
  const showSidebar = !NO_SIDEBAR_PATHS.includes(location.pathname)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className={showSidebar ? 'mx-auto flex max-w-6xl gap-6 px-4 pt-6 sm:px-6' : ''}>
        {showSidebar && <Sidebar />}
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
      </div>
    </div>
  )
}
