import re
import os

# 1. Create Settings.jsx
settings_content = """import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [error, setError] = useState(null)

  const handleDeleteAccount = async () => {
    const confirmPrompt = window.prompt(
      'WARNING: This will permanently delete your account, projects, applications, connections, and portfolio data.\\n\\nType DELETE to confirm:'
    )
    if (confirmPrompt !== 'DELETE') return

    setDeletingAccount(true)
    try {
      await api.deleteAccount()
      await logout()
      navigate('/')
    } catch (err) {
      setError(err.message)
      setDeletingAccount(false)
    }
  }

  if (!user) return null

  return (
    <div className="w-full max-w-[640px] mx-auto pb-24">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage your account preferences and settings.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Danger Zone: Account Deletion */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6 mt-8">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle size={18} />
          <h2 className="font-semibold text-sm uppercase tracking-wider">Danger Zone</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-red-700">
          Permanently delete your account and all associated data including your projects, applications, portfolio entries, and connections. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
        >
          {deletingAccount ? 'Deleting account...' : 'Delete Account'}
        </button>
      </section>
    </div>
  )
}
"""
with open('frontend/src/pages/Settings.jsx', 'w') as f:
    f.write(settings_content)

# 2. Modify App.jsx
with open('frontend/src/App.jsx', 'r') as f:
    app_jsx = f.read()

app_jsx = app_jsx.replace(
    "import Profile from './pages/Profile.jsx'",
    "import Profile from './pages/Profile.jsx'\nimport Settings from './pages/Settings.jsx'"
)
app_jsx = app_jsx.replace(
    '<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />',
    '<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />\n            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />'
)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(app_jsx)

# 3. Modify Navbar.jsx
with open('frontend/src/components/Navbar.jsx', 'r') as f:
    navbar_jsx = f.read()

if "import { Settings" not in navbar_jsx and "Settings," not in navbar_jsx:
    navbar_jsx = navbar_jsx.replace("import { Search,", "import { Search, Settings,")
    navbar_jsx = navbar_jsx.replace("import { Menu,", "import { Menu, Settings,")

settings_link = """                  <Link
                    to="/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <User size={15} /> Your dashboard
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Settings size={15} /> Settings
                  </Link>"""
navbar_jsx = navbar_jsx.replace("""                  <Link
                    to="/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <User size={15} /> Your dashboard
                  </Link>""", settings_link)

with open('frontend/src/components/Navbar.jsx', 'w') as f:
    f.write(navbar_jsx)

# 4. Modify Profile.jsx
with open('frontend/src/pages/Profile.jsx', 'r') as f:
    profile_jsx = f.read()

# Remove state
profile_jsx = re.sub(r'const \[deletingAccount, setDeletingAccount\] = useState\(false\)\n?', '', profile_jsx)

# Remove handleDeleteAccount
handle_delete_regex = r'// Account deletion\n  const handleDeleteAccount = async \(\) => \{[\s\S]*?catch \(err\) \{\n      setError\(err\.message\)\n      setDeletingAccount\(false\)\n    \}\n  \}\n'
profile_jsx = re.sub(handle_delete_regex, '', profile_jsx)

# Remove Danger Zone section
danger_zone_regex = r'\{\/\* Danger Zone: Account Deletion \*\/\}\n      <section className="rounded-2xl border border-red-200 bg-red-50\/50 p-5 sm:p-6">[\s\S]*?<\/section>'
profile_jsx = re.sub(danger_zone_regex, '', profile_jsx)

with open('frontend/src/pages/Profile.jsx', 'w') as f:
    f.write(profile_jsx)

print("Settings moved successfully!")
