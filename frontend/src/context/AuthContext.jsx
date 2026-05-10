import React, { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { authAPI } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const fetchingRef = useRef(false)

  // Fetch user profile — guarded against concurrent/re-entrant calls
  const fetchUser = useCallback(async () => {
    if (fetchingRef.current) return
    const currentToken = localStorage.getItem('access_token')
    if (currentToken) {
      fetchingRef.current = true
      try {
        const response = await authAPI.getProfile()
        setUser(response.data)

        // Fetch subscription info
        try {
          const subResponse = await authAPI.getSubscription()
          setSubscription(subResponse.data)
        } catch (e) {
          setSubscription(null)
        }
      } catch (error) {
        // 401 is already handled by the API interceptor (clears tokens, fires event)
        // For other errors just log and clear state
        console.error('Failed to fetch user:', error)
        setUser(null)
        setToken(null)
      } finally {
        fetchingRef.current = false
      }
    }
    setLoading(false)
  }, []) // no dependency on token — reads directly from localStorage

  // Run once on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Listen for the 'auth:logout' event dispatched by the API interceptor.
  // This lets us clear React state without triggering a full page reload.
  useEffect(() => {
    const handleForceLogout = () => {
      setToken(null)
      setUser(null)
      setSubscription(null)
      setLoading(false)
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password)
      const { access, refresh } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setToken(access)
      
      // Fetch user after login
      const userResponse = await authAPI.getProfile()
      setUser(userResponse.data)
      
      // Fetch subscription
      try {
        const subResponse = await authAPI.getSubscription()
        setSubscription(subResponse.data)
      } catch (e) {
        setSubscription(null)
      }
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      }
    }
  }

  const register = async (formData) => {
    try {
      await authAPI.register(formData)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
    setSubscription(null)
  }

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data)
      setUser(response.data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Update failed'
      }
    }
  }

  const isAuthenticated = Boolean(token && user)

  // Superadmin/staff always see Elite tier across all UI (for testing all features)
  const isSuperAdmin = user?.is_superuser || user?.is_staff
  const effectiveSubscription = isSuperAdmin
    ? {
        status: 'active',
        tier_details: { name: 'Elite', sessions_per_week: 3 },
        plan: { billing_cycle: 'monthly', price: '99.99' },
      }
    : subscription

  const value = {
    user,
    token,
    loading,
    subscription: effectiveSubscription,
    isAuthenticated,
    isSuperAdmin,
    login,
    register,
    logout,
    updateProfile,
    fetchUser,
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
