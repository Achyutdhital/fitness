import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiLock, FiZap, FiArrowRight } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { motion, AnimatePresence } from 'framer-motion'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'
  const selectedPlan = location.state?.plan || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(username, password)
    if (result.success) {
      if (selectedPlan) {
        navigate('/payment', { state: { pkg: selectedPlan } })
      } else {
        navigate(from, { replace: true })
      }
    } else {
      setError(result.error)
    }
    setLoading(false)
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
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <FiZap size={24} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">FitCoach<span className="text-orange-500">Pro</span></span>
            </Link>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Back</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Access your elite training dashboard</p>
          </div>

          <AnimatePresence mode="wait">
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
          
          <div className="space-y-3 mb-8">
            <motion.button
              onClick={() => {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
                window.location.href = `${apiBase}/auth/oauth/google/start/`
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-black/20"
            >
              <FcGoogle size={20} />
              Continue with Google
            </motion.button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Or Email</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Identity</label>
              <div className="relative group">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Credential</label>
                <Link to="/forgot-password" size={10} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400">Recovery</Link>
              </div>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-slate-500 text-sm font-bold">
              New to the platform?{' '}
              <Link 
                to="/onboarding" 
                state={{ pkg: selectedPlan }}
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                Apply Now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
