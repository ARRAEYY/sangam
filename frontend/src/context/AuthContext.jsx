import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check if we have a valid session cookie
  useEffect(() => {
    api
      .getProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.login({ email, password })
    // The cookie is set automatically by the browser
    const profile = await api.getProfile()
    setUser(profile)
    return profile
  }

  const register = async (payload) => {
    // Registration no longer auto-logs in — it requires email verification
    const result = await api.register(payload)
    return result  // { message: "..." }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // ignore — cookie may already be expired
    }
    setUser(null)
  }

  const refreshProfile = async () => {
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
