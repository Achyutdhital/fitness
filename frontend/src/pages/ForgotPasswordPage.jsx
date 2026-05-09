import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { FiMail } from 'react-icons/fi'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await authAPI.requestPasswordReset(email)
      setMessage(response.data?.message || 'If that email exists, a reset link has been sent.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-gray-600 mb-6">Enter your email and we’ll send you a reset link.</p>

        {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 font-bold disabled:opacity-50">
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Back to{' '}
          <Link to="/login" className="text-red-500 hover:text-red-600 font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
