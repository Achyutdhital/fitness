import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { workoutAPI, subscriptionAPI, paymentAPI, authAPI } from '../services/api'
import { FiUsers, FiDollarSign, FiActivity, FiTrendingUp, FiSettings, FiList, FiBarChart2, FiShield, FiArrowRight } from 'react-icons/fi'
import { Link, Navigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalWorkouts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [inquiries, setInquiries] = useState([])

  // Redirect non-staff users
  if (user && !user.is_staff && !user.is_superuser) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      const [adminRes, workoutsRes] = await Promise.allSettled([
        authAPI.getAdminStats(),
        workoutAPI.getWorkouts(),
        cmsAPI.getContactMessages(),
      ])

      if (adminRes.status === 'fulfilled') {
        const d = adminRes.value.data
        setStats({
          totalUsers: d.total_users,
          activeSubscriptions: d.active_subscriptions,
          totalRevenue: d.total_revenue.toFixed(2),
          totalWorkouts: d.total_workouts_completed,
          newUsersThisMonth: d.new_users_this_month,
        })
      } else if (workoutsRes.status === 'fulfilled') {
        const workouts = workoutsRes.value.data.results || workoutsRes.value.data || []
        setStats(prev => ({ ...prev, totalWorkouts: workouts.length }))
      }

      // Stats from adminRes are already set. Other data is handled by specific effects if needed.
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refined data loading to handle the 3rd promise properly
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await cmsAPI.getContactMessages()
        setInquiries(res.data.results || res.data || [])
      } catch (err) {
        console.error("Failed to load inquiries", err)
      }
    }
    if (activeTab === 'operations') fetchInquiries()
  }, [activeTab])

  const adminCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue}`, icon: FiDollarSign, color: 'from-green-500 to-teal-500', change: '+12% this month' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: FiUsers, color: 'from-blue-500 to-cyan-500', change: '+5 this week' },
    { label: 'Total Workouts', value: stats.totalWorkouts, icon: FiActivity, color: 'from-orange-500 to-pink-500', change: 'In library' },
    { label: 'Avg. Rating', value: '4.8★', icon: FiTrendingUp, color: 'from-purple-500 to-indigo-500', change: 'Excellent' },
  ]

  const adminLinks = [
    { label: 'Manage Users', desc: 'View and manage user accounts', icon: FiUsers, href: 'http://localhost:8000/admin/accounts/', color: 'from-blue-500 to-cyan-500' },
    { label: 'Subscription Plans', desc: 'Create and edit pricing plans', icon: FiDollarSign, href: 'http://localhost:8000/admin/subscriptions/', color: 'from-green-500 to-teal-500' },
    { label: 'Workout Library', desc: 'Add and manage workouts', icon: FiActivity, href: 'http://localhost:8000/admin/workouts/', color: 'from-orange-500 to-pink-500' },
    { label: 'Payments', desc: 'View transactions and invoices', icon: FiBarChart2, href: 'http://localhost:8000/admin/payments/', color: 'from-purple-500 to-indigo-500' },
    { label: 'CMS Content', desc: 'Manage blog posts and pages', icon: FiList, href: 'http://localhost:8000/admin/cms/', color: 'from-yellow-500 to-orange-500' },
    { label: 'Site Settings', desc: 'Configure site-wide settings', icon: FiSettings, href: 'http://localhost:8000/admin/', color: 'from-gray-500 to-gray-600' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FiShield className="text-white" size={20} />
              </div>
              <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
            </div>
            <p className="text-gray-400">Welcome back, {user?.username}. Here's what's happening.</p>
          </div>
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex items-center space-x-2"
          >
            <FiSettings size={18} />
            <span>Django Admin</span>
          </a>
        </div>

        {/* Main Content Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-2xl w-fit mb-8 border border-gray-700">
          {['overview', 'operations', 'revenue'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {adminCards.map((card, i) => (
                <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-700 hover:border-orange-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <card.icon className="text-white" size={24} />
                    </div>
                    <span className="text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-lg">{card.change}</span>
                  </div>
                  <p className="text-4xl font-black text-white mb-1">{card.value}</p>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <h2 className="text-white font-black text-2xl mb-8 flex items-center space-x-3">
              <FiList className="text-orange-500" />
              <span>Platform Control</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {adminLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-gray-700 hover:border-orange-500/50 transition-all duration-500"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                      <link.icon className="text-white" size={28} />
                    </div>
                    <FiArrowRight className="text-gray-600 group-hover:text-orange-400 transition-colors" size={24} />
                  </div>
                  <h3 className="text-white font-black text-xl mb-2 group-hover:text-orange-400 transition-colors">{link.label}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{link.desc}</p>
                </a>
              ))}
            </div>
          </>
        )}

        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-800/50 rounded-[2.5rem] p-8 border border-gray-700">
               <h3 className="text-white font-black text-xl mb-6">Live Coaching Sessions</h3>
               <div className="space-y-4">
                  <div className="p-12 text-center border-2 border-dashed border-gray-700 rounded-3xl">
                     <FiActivity className="text-gray-700 mx-auto mb-4" size={48} />
                     <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Active Streams</p>
                  </div>
               </div>
            </div>
            <div className="bg-gray-800/50 rounded-[2.5rem] p-8 border border-gray-700">
               <h3 className="text-white font-black text-xl mb-6">Active Program Stages</h3>
               <div className="space-y-6">
                  {['Foundation (Week 1-4)', 'Power (Week 5-8)', 'Elite (Week 9-12)'].map((stage, i) => (
                    <div key={stage} className="space-y-2">
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                          <span className="text-gray-400">{stage}</span>
                          <span className="text-orange-500">{[45, 28, 12][i]} Users</span>
                       </div>
                       <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500" 
                            style={{ width: `${[70, 45, 20][i]}%` }}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="bg-gray-800/50 rounded-[2.5rem] p-8 border border-gray-700 lg:col-span-2">
               <h3 className="text-white font-black text-xl mb-6">Client Inquiries</h3>
               <div className="space-y-4">
                  {inquiries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inquiries.slice(0, 6).map((inq) => (
                        <div key={inq.id} className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700 hover:border-orange-500/30 transition-all">
                           <div className="flex justify-between items-start mb-3">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${inq.status === 'new' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                {inq.status}
                              </span>
                              <span className="text-gray-600 text-[10px]">{new Date(inq.created_at).toLocaleDateString()}</span>
                           </div>
                           <h4 className="text-white font-bold mb-1">{inq.subject}</h4>
                           <p className="text-gray-500 text-xs mb-4 line-clamp-2">{inq.message}</p>
                           <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                              <span className="text-[10px] text-gray-400 font-bold">{inq.name}</span>
                              <a href={`mailto:${inq.email}`} className="text-orange-500 text-[10px] font-black uppercase tracking-widest hover:underline">Reply →</a>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed border-gray-700 rounded-3xl">
                       <FiList className="text-gray-700 mx-auto mb-4" size={48} />
                       <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No pending inquiries</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiShield className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Full Admin Panel Available</h3>
              <p className="text-gray-300 text-sm mb-3">
                For complete content management including adding workouts, meal plans, blog posts, and managing all users, 
                use the Django Admin panel at <code className="text-orange-400">localhost:8000/admin</code>
              </p>
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-sm inline-flex items-center space-x-2"
              >
                <span>Open Full Admin Panel</span>
                <FiArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
