import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI, paymentAPI } from '../services/api'
import { 
  FiUser, FiMail, FiLock, FiSave, FiCreditCard, 
  FiCalendar, FiTrendingUp, FiTarget, FiActivity, 
  FiAward, FiZap, FiChevronRight, FiCheck
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

const ProfilePage = () => {
  const { user, subscription, updateProfile, fetchUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [payments, setPayments] = useState([])
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    height: '',
    weight: '',
    fitness_level: 'beginner',
  })
  const [profileDetails, setProfileDetails] = useState({ goals: '' })

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        height: user.height || '',
        weight: user.weight || '',
        fitness_level: user.fitness_level || 'beginner',
      })
    }
    loadProfileDetails()
    loadPayments()
  }, [user])

  const navigate = useNavigate()

  const loadProfileDetails = async () => {
    try {
      const response = await authAPI.getProfileDetails()
      setProfileDetails({
        goals: response.data?.goals || '',
      })
    } catch (error) {
      console.error('Failed to load profile details:', error)
    }
  }

  const loadPayments = async () => {
    try {
      const response = await paymentAPI.getPayments()
      const pData = response.data.results || response.data || []
      setPayments(Array.isArray(pData) ? pData : [])
    } catch (error) {
      console.error('Failed to load payments:', error)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        await authAPI.updateProfileDetails({ goals: profileDetails.goals })
        setMessage({ type: 'success', text: 'Package parameters updated successfully.' })
        await fetchUser()
      } else {
        setMessage({ type: 'error', text: result.error || 'Update failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected transmission error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Security tokens do not match.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setMessage({ type: 'success', text: 'Security credentials updated successfully.' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Credential update failed' })
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Current Weight', value: `${user?.weight || '--'} kg`, icon: FiTrendingUp, color: 'from-blue-500 to-cyan-500' },
    { label: 'Height', value: `${user?.height || '--'} cm`, icon: FiActivity, color: 'from-green-500 to-teal-500' },
    { label: 'Fitness Level', value: user?.fitness_level || 'Not set', icon: FiTarget, color: 'from-orange-500 to-pink-500' },
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A', icon: FiAward, color: 'from-purple-500 to-indigo-500' },
  ]

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">Athlete <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Profile</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Manage your elite credentials and performance parameters</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-800/50"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 shadow-lg`}>
                <stat.icon className="text-white" size={20} />
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-black tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-slate-900/50 p-1 rounded-2xl w-fit border border-slate-800/50">
          {[
            { id: 'profile', label: 'Identity', icon: FiUser },
            { id: 'subscription', label: 'Package', icon: FiCreditCard },
            { id: 'security', label: 'Security', icon: FiLock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <motion.div 
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-slate-800/50"
          >
            <AnimatePresence mode="wait">
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${
                    message.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}
                >
                  {message.type === 'success' ? <FiCheck /> : <FiZap />}
                  <p>{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">First Name</label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Last Name</label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Communication (Email)</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Direct Link (Phone)</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Bio-Metrics (Height/Weight)</label>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="cm"
                        value={profileData.height}
                        onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                        className="w-1/2 bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="kg"
                        value={profileData.weight}
                        onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                        className="w-1/2 bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Experience Level</label>
                    <select
                      value={profileData.fitness_level}
                      onChange={(e) => setProfileData({ ...profileData, fitness_level: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Core Fitness Objectives</label>
                   <textarea
                     value={profileDetails.goals}
                     onChange={(e) => setProfileDetails({ ...profileDetails, goals: e.target.value })}
                     className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all min-h-[120px] resize-none"
                     placeholder="Describe your ultimate physical transformation goal..."
                   />
                </div>

                <button type="submit" disabled={loading} className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3">
                  <FiSave />
                  <span>{loading ? 'Processing...' : 'Synchronize Profile'}</span>
                </button>
              </form>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-12">
                <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-[2rem] p-10 text-white relative overflow-hidden group">
                  <FiZap className="absolute top-0 right-0 text-white/10 -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700" size={240} />
                  <div className="relative z-10">
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">Current Active Package</p>
                    <h3 className="text-5xl font-black mb-8 tracking-tight">
                      {subscription?.is_custom 
                        ? `Custom (${subscription?.custom_config?.sessions_per_week}x${subscription?.custom_config?.session_duration_minutes}min)` 
                        : subscription?.tier_details?.name || 'Free Tier'}
                    </h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                          <p className="font-bold text-sm flex items-center gap-2">
                            {subscription?.status?.toUpperCase() || 'ACTIVE'}
                            {subscription?.is_expiring_soon && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Expiration</p>
                          <p className="font-bold text-sm">{subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'INDIVIDUAL UNLOCKS'}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Renewal Window</p>
                          <p className={`font-bold text-[10px] ${subscription?.is_in_renewal_window ? 'text-green-400' : 'text-white/40'}`}>
                            {subscription?.is_in_renewal_window ? 'OPEN (7D WINDOW)' : 'CLOSED'}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Sessions</p>
                          <p className="font-bold text-sm">
                            {subscription?.is_custom 
                              ? `${subscription?.custom_config?.sessions_per_week} / Week` 
                              : `${subscription?.tier_details?.sessions_per_week || 0} / Week`}
                          </p>
                        </div>
                     </div>
                     {subscription?.is_expiring_soon && (
                       <div className="mt-8 p-4 bg-black/20 border border-white/10 rounded-2xl flex items-center gap-3">
                         <FiAlertCircle className="text-orange-400" />
                         <p className="text-xs text-white/80">Your pkg is approaching its termination date. Ensure renewal within the window to avoid service interruption.</p>
                       </div>
                     )}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white mb-6">Execution Log (Billing)</h3>
                  {payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-orange-500">
                               <FiCreditCard />
                            </div>
                            <div>
                               <p className="text-white font-bold text-sm">${payment.amount}</p>
                               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{new Date(payment.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${payment.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {payment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
                       <p className="text-slate-600 font-bold text-sm italic">No transaction records found in pkg.</p>
                    </div>
                  )}
                </div>

                 <div className="flex gap-4">
                   <button onClick={() => navigate('/profile/subscriptions')} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-100 shadow-xl">Manage Subscriptions</button>
                   <button onClick={() => navigate('/profile/subscriptions')} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-700 border border-slate-700">Cancel / Change</button>
                 </div>
              </div>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-8 max-w-md">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Current Access Token</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">New Access Token</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Confirm Token</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3">
                  <FiLock />
                  <span>{loading ? 'Updating...' : 'Regenerate Security'}</span>
                </button>
              </form>
            )}
          </motion.div>

          {/* Sidebar / Profile Summary */}
          <div className="space-y-8">
             <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                   <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full animate-pulse blur-lg opacity-20" />
                   <img 
                    src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.username}&background=f97316&color=fff&size=128`} 
                    className="w-full h-full object-cover rounded-full border-4 border-slate-800 relative z-10" 
                    alt="Profile"
                   />
                </div>
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{user?.first_name} {user?.last_name}</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">@{user?.username}</p>
                <div className="flex justify-center gap-2">
                   <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                     {user?.role || 'Member'}
                   </span>
                </div>
             </div>

             <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50">
                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                   <FiZap className="text-orange-500" />
                   <span>Elite Status</span>
                </h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-widest">Global Rank</span>
                      <span className="text-white">Top 1%</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-widest">Total Points</span>
                      <span className="text-orange-400 font-black">{user?.points?.total_points || 0} XP</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-widest">Verified Status</span>
                      <span className={user?.is_verified ? 'text-green-400' : 'text-slate-600'}>
                        {user?.is_verified ? 'COMPLIANT' : 'PENDING'}
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
