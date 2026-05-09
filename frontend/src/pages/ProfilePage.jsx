import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI, paymentAPI } from '../services/api'
import { FiUser, FiMail, FiLock, FiSave, FiCreditCard, FiCalendar, FiTrendingUp, FiTarget, FiActivity, FiAward } from 'react-icons/fi'

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
        phone: user.phone || '',
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
      setPayments(response.data.results || response.data || [])
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
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        await fetchUser()
      } else {
        setMessage({ type: 'error', text: result.error || 'Update failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Password change failed' })
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Current Weight', value: `${user?.weight || 0} kg`, icon: FiTrendingUp, color: 'from-blue-500 to-cyan-500' },
    { label: 'Height', value: `${user?.height || 0} cm`, icon: FiActivity, color: 'from-green-500 to-teal-500' },
    { label: 'Fitness Level', value: user?.fitness_level || 'Not set', icon: FiTarget, color: 'from-orange-500 to-pink-500' },
    { label: 'Member Since', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A', icon: FiAward, color: 'from-purple-500 to-indigo-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile Info', icon: FiUser },
            { id: 'subscription', label: 'Subscription', icon: FiCreditCard },
            { id: 'security', label: 'Security', icon: FiLock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Gender</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={profileData.height}
                    onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={profileData.weight}
                    onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                    className="input-field bg-gray-900 text-white border-gray-700"
                  />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-gray-300 font-medium mb-2">Fitness Level</label>
                   <select
                     value={profileData.fitness_level}
                     onChange={(e) => setProfileData({ ...profileData, fitness_level: e.target.value })}
                     className="input-field bg-gray-900 text-white border-gray-700"
                   >
                     <option value="beginner">Beginner</option>
                     <option value="intermediate">Intermediate</option>
                     <option value="advanced">Advanced</option>
                   </select>
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-gray-300 font-medium mb-2">Primary Fitness Goal</label>
                   <textarea
                     value={profileDetails.goals}
                     onChange={(e) => setProfileDetails({ ...profileDetails, goals: e.target.value })}
                     className="input-field bg-gray-900 text-white border-gray-700 min-h-24"
                     placeholder="Describe your goal (fat loss, strength, endurance, etc.)"
                   />
                 </div>
               </div>

              <button type="submit" disabled={loading} className="btn btn-primary flex items-center space-x-2">
                <FiSave />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm">Current Plan</p>
                    <h3 className="text-3xl font-black">{subscription?.subscription_plan?.name || 'Free Trial'}</h3>
                  </div>
                  <FiCreditCard size={40} className="text-white/50" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/70">Status</p>
                    <p className="font-bold">{subscription?.status || 'Active'}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Renews On</p>
                    <p className="font-bold">{subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-xl mb-4">Payment History</h3>
                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between border border-gray-700">
                        <div>
                          <p className="text-white font-medium">${payment.amount}</p>
                          <p className="text-gray-400 text-sm">{new Date(payment.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No payment history yet</p>
                )}
              </div>

              <button className="btn btn-primary">Upgrade Plan</button>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="input-field bg-gray-900 text-white border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="input-field bg-gray-900 text-white border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="input-field bg-gray-900 text-white border-gray-700"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary flex items-center space-x-2">
                <FiLock />
                <span>{loading ? 'Changing...' : 'Change Password'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
