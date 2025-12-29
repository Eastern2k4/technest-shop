// frontend/technest-app/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)
const USER_KEY = 'tn_user'
const normRole = r => (r ? String(r).toUpperCase().replace(/^ROLE_/,'') : '')

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [ready, setReady] = useState(false)

  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const u = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return u ? { ...u, role: normRole(u.role), accessToken: u.accessToken || u.token || null } : null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    setReady(true)
  }, [])

  // Persist
  useEffect(() => {
    if (typeof window === 'undefined') return
    user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY)
  }, [user])

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e) => {
      if (e.key !== USER_KEY) return
      const next = e.newValue ? JSON.parse(e.newValue) : null
      setUser(next ? { ...next, role: normRole(next.role), accessToken: next.accessToken || next.token || null } : null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = (userData, returnTo = null) => {
    const fixed = {
      ...userData,
      fullName: userData.fullName || userData.name || '',
      role: normRole(userData.role),
      accessToken: userData.accessToken || userData.token || null,
    }
    setUser(fixed)

    // Điều hướng: ưu tiên returnTo, sau đó theo vai trò
    if (returnTo) {
      navigate(returnTo, { replace: true })
    } else if (fixed.role === 'ADMIN') {
      navigate('/admin', { replace: true })
    } else if (fixed.role === 'STAFF') {
      navigate('/staff', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY)
    navigate('/signin', { replace: true })
  }

  const authHeader = useMemo(() => {
    const t = user?.accessToken || user?.token
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [user])

  const value = useMemo(() => ({
    ready,
    user,
    isAuthenticated: !!(user?.accessToken || user?.token),
    role: user?.role || null,
    token: user?.accessToken || user?.token || null,
    login,
    logout,
    authHeader,
  }), [ready, user, authHeader])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
