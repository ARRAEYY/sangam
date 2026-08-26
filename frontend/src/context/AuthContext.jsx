import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Attempt to fetch profile on mount using HttpOnly cookie
    api
      .getProfile()
      .then(setUser)
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.login({ email, password })
    const profile = data.user || (await api.getProfile())
    setUser(profile)
    return profile
  }

  const loginWithGoogle = async (credential) => {
    const data = await api.loginWithGoogle(credential)
    const profile = data.user || (await api.getProfile())
    setUser(profile)
    return profile
  }

  const register = async (payload) => {
    const result = await api.register(payload)
    // Register might return a user if email verification is bypassed, but we made it mandatory
    return result
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // ignore
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
      value={{ user, loading, login, loginWithGoogle, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
