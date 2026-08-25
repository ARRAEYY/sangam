import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('campus_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    api
      .getProfile(token)
      .then(setUser)
      .catch(() => {
        setToken(null)
        localStorage.removeItem('campus_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    const data = await api.login({ email, password })
    if (data.access_token) {
      localStorage.setItem('campus_token', data.access_token)
      setToken(data.access_token)
    }
    const profile = data.user || (await api.getProfile(data.access_token))
    setUser(profile)
    return profile
  }

  const register = async (payload) => {
    const result = await api.register(payload)
    return result
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // ignore
    }
    localStorage.removeItem('campus_token')
    setToken(null)
    setUser(null)
  }

  const refreshProfile = async () => {
    try {
      const profile = await api.getProfile(token)
      setUser(profile)
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
