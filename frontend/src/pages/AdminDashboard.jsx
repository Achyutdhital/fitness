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
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminCards.map((card, i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="text-white" size={24} />
                </div>
                <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-full">{card.change}</span>
              </div>
              <p className="text-4xl font-black text-white mb-1">{card.value}</p>
              <p className="text-gray-400 text-sm">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Admin Quick Links */}
        <div className="mb-8">
          <h2 className="text-white font-bold text-2xl mb-6">Quick Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center`}>
                    <link.icon className="text-white" size={24} />
                  </div>
                  <FiArrowRight className="text-gray-600 group-hover:text-orange-400 transition-colors" size={20} />
                </div>
                <h3 className="text-white font-bold text-lg mb-1 group-hover:text-orange-400 transition-colors">{link.label}</h3>
                <p className="text-gray-400 text-sm">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>

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
