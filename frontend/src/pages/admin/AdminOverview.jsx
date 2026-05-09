import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI, workoutAPI, subscriptionAPI } from '../../services/api'
import { FiUsers, FiDollarSign, FiActivity, FiTrendingUp, FiArrowRight, FiUserPlus, FiZap } from 'react-icons/fi'

const AdminOverview = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authAPI.getAdminStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: FiUsers, color: 'from-blue-500 to-cyan-500', sub: `+${stats.new_users_this_month} this month` },
    { label: 'Active Subscriptions', value: stats.active_subscriptions, icon: FiZap, color: 'from-orange-500 to-pink-500', sub: 'Currently active' },
    { label: 'Total Revenue', value: `$${Number(stats.total_revenue).toFixed(2)}`, icon: FiDollarSign, color: 'from-green-500 to-teal-500', sub: 'All time' },
    { label: 'Workouts Completed', value: stats.total_workouts_completed, icon: FiActivity, color: 'from-purple-500 to-indigo-500', sub: 'By all users' },
  ] : []

  const quickLinks = [
    { to: '/admin/workouts', label: 'Add Workout', icon: FiActivity, color: 'from-orange-500 to-pink-500' },
    { to: '/admin/meal-plans', label: 'Add Meal Plan', icon: FiTrendingUp, color: 'from-green-500 to-teal-500' },
    { to: '/admin/blog', label: 'Write Blog Post', icon: FiArrowRight, color: 'from-blue-500 to-cyan-500' },
    { to: '/admin/subscriptions', label: 'Manage Plans', icon: FiDollarSign, color: 'from-purple-500 to-indigo-500' },
    { to: '/admin/users', label: 'View Users', icon: FiUsers, color: 'from-yellow-500 to-orange-500' },
    { to: '/admin/messages', label: 'View Messages', icon: FiUserPlus, color: 'from-pink-500 to-rose-500' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm">Welcome back. Here's what's happening with your platform.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
                <c.icon className="text-white" size={18} />
              </div>
              <p className="text-2xl font-black text-white">{c.value}</p>
              <p className="text-gray-400 text-xs mt-1">{c.label}</p>
              <p className="text-gray-500 text-xs">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((l, i) => (
            <Link
              key={i}
              to={l.to}
              className="group bg-gray-800/50 rounded-2xl p-5 border border-gray-700 hover:border-orange-500/50 transition-all hover:-translate-y-0.5 flex items-center space-x-3"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${l.color} flex items-center justify-center flex-shrink-0`}>
                <l.icon className="text-white" size={18} />
              </div>
              <span className="text-gray-300 font-medium text-sm group-hover:text-white transition-colors">{l.label}</span>
              <FiArrowRight className="ml-auto text-gray-600 group-hover:text-orange-400 transition-colors" size={16} />
            </Link>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-5">
        <p className="text-white font-semibold mb-1">💡 Pro Tip</p>
        <p className="text-gray-400 text-sm">
          Use the sidebar to manage all content. Changes made here are reflected on the live website immediately.
          For database-level operations, use <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Django Admin ↗</a>
        </p>
      </div>
    </div>
  )
}

export default AdminOverview
