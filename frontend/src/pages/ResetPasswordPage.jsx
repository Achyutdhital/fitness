import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authAPI } from '../services/api'
import { FiLock } from 'react-icons/fi'

const ResetPasswordPage = () => {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await authAPI.confirmPasswordReset(uid, token, formData.new_password, formData.confirm_password)
      setMessage(response.data?.message || 'Password reset successfully.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.new_password?.[0] || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-600 mb-6">Set a new password for your account.</p>

        {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                id="new_password"
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                required
                className="input-field pl-10"
                minLength={8}
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                required
                className="input-field pl-10"
                minLength={8}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 font-bold disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage
