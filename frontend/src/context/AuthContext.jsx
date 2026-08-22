import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('campus_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api
      .getProfile(token)
      .then(setUser)
      .catch(() => {
        setToken(null)
        localStorage.removeItem('campus_token')
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    const { access_token } = await api.login({ email, password })
    localStorage.setItem('campus_token', access_token)
    setToken(access_token)
    const profile = await api.getProfile(access_token)
    setUser(profile)
    return profile
  }

  const loginWithGoogle = async (credential) => {
    const { access_token } = await api.loginWithGoogle(credential)
    localStorage.setItem('campus_token', access_token)
    setToken(access_token)
    const profile = await api.getProfile(access_token)
    setUser(profile)
    return profile
  }

  const register = async (payload) => {
    const { access_token } = await api.register(payload)
    localStorage.setItem('campus_token', access_token)
    setToken(access_token)
    const profile = await api.getProfile(access_token)
    setUser(profile)
    return profile
  }

  const logout = () => {
    localStorage.removeItem('campus_token')
    setToken(null)
    setUser(null)
  }

  const refreshProfile = async () => {
    if (!token) return
    const profile = await api.getProfile(token)
    setUser(profile)
  }

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, loginWithGoogle, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
