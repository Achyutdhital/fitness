import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook } from 'react-icons/fa'

const EnhancedSignupPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  
  // Get onboarding data from session or route state
  const onboardingData = location.state?.onboarding_data || sessionStorage.getItem('onboarding_data')
  const parsedData = typeof onboardingData === 'string' ? JSON.parse(onboardingData) : onboardingData

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    agree_terms: false,
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const { register, login } = useAuth()

  // If no onboarding data, show incomplete message
  useEffect(() => {
    if (!parsedData) {
      // Optionally redirect back to onboarding or allow signup without it
      // For now, allow signup anyway
    }
  }, [parsedData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username?.trim()) newErrors.username = 'Username is required'
    if (!formData.email?.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match'
    if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required'
    if (!formData.agree_terms) newErrors.agree_terms = 'You must agree to the terms'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const registrationData = {
        ...formData,
        // Include onboarding data if available
        ...(parsedData && {
          gender: parsedData.gender,
          age: parsedData.age,
          height_ft: parsedData.height_ft,
          height_in: parsedData.height_in,
          height_cm: parsedData.height_cm,
          height_m: parsedData.height_m,
          height_unit: parsedData.height_unit,
          weight: parsedData.weight,
          weight_unit: parsedData.weight_unit,
          fitness_goal: parsedData.goal,
          activity_level: parsedData.activity_level,
          dietary_preference: parsedData.dietary_preference,
        }),
      }

      const result = await register(registrationData)

      if (result.success) {
        setSuccess('Account created successfully! Logging you in...')
        sessionStorage.removeItem('onboarding_data')

        setTimeout(async () => {
          const loginResult = await login(formData.username, formData.password)
          if (loginResult.success) {
            navigate('/dashboard')
          }
        }, 1500)
      } else {
        const errorMsg = typeof result.error === 'object'
          ? Object.values(result.error).flat().join(', ')
          : result.error || 'Registration failed'
        setErrors({ submit: errorMsg })
      }
    } catch (error) {
      setErrors({ submit: error.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const state = btoa(JSON.stringify(parsedData || {}))
    window.location.href = `${apiBase}/auth/oauth/google/start/?state=${encodeURIComponent(state)}`
  }

  const handleFacebookSignup = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const state = btoa(JSON.stringify(parsedData || {}))
    window.location.href = `${apiBase}/auth/oauth/facebook/start/?state=${encodeURIComponent(state)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Join FitPro and start your transformation</p>
          </div>

          {/* OAuth Options */}
          <div className="space-y-3 mb-6">
            <motion.button
              onClick={handleGoogleSignup}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/30 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-700/50 transition-all"
            >
              <FcGoogle size={20} />
              Sign up with Google
            </motion.button>
            <motion.button
              onClick={handleFacebookSignup}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/30 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-700/50 transition-all"
            >
              <FaFacebook size={20} />
              Sign up with Facebook
            </motion.button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-600/50"></div>
            <span className="text-slate-400 text-sm">Or email</span>
            <div className="flex-1 h-px bg-slate-600/50"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Onboarding Data Preview */}
            {parsedData && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300 mb-4">
                ✓ Your fitness profile is ready to be linked to your account
              </div>
            )}

            {/* Error Message */}
            {query.get('oauth_error') && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                Social sign in failed: {query.get('oauth_error')}
              </div>
            )}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                {errors.submit}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
                {success}
              </div>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">First Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-700/30 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.first_name ? 'border-red-500' : 'border-slate-600 focus:border-orange-500'
                  }`}
                />
              </div>
              {errors.first_name && <p className="text-red-400 text-sm mt-1">{errors.first_name}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="fitpro_user"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-700/30 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.username ? 'border-red-500' : 'border-slate-600 focus:border-orange-500'
                  }`}
                />
              </div>
              {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-700/30 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.email ? 'border-red-500' : 'border-slate-600 focus:border-orange-500'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-700/30 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.password ? 'border-red-500' : 'border-slate-600 focus:border-orange-500'
                  }`}
                />
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-700/30 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.password2 ? 'border-red-500' : 'border-slate-600 focus:border-orange-500'
                  }`}
                />
              </div>
              {errors.password2 && <p className="text-red-400 text-sm mt-1">{errors.password2}</p>}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="agree_terms"
                id="terms"
                checked={formData.agree_terms}
                onChange={handleChange}
                className="mt-1 rounded cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer">
                I agree to the{' '}
                <a href="/terms" className="text-orange-400 hover:text-orange-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-orange-400 hover:text-orange-300">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agree_terms && <p className="text-red-400 text-sm">{errors.agree_terms}</p>}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/30 mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <FiArrowRight size={20} />}
            </motion.button>
          </form>

          {/* Login Link */}
          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default EnhancedSignupPage
