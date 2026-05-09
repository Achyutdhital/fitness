import React, { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)

  // Fetch user profile
  const fetchUser = useCallback(async () => {
    if (token) {
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
        console.error('Failed to fetch user:', error)
        localStorage.removeItem('access_token')
        setToken(null)
        setUser(null)
      }
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

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

  const value = {
    user,
    token,
    loading,
    subscription,
    isAuthenticated,
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
