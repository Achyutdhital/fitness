import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { FiMail, FiZap } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] -z-10 rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/50 p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Recovery</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Enter your email to reset credentials</p>
          </div>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-xs font-bold"
              >
                <p>{message}</p>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <FiZap />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Send Recovery Link'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-slate-500 text-sm font-bold">
              Remember your password?{' '}
              <Link to="/login" className="text-orange-500 hover:text-orange-400 transition-colors">Authenticate</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage
