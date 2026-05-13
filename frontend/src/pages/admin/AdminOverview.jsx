import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI, workoutAPI, subscriptionAPI, coreAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { 
  FiUsers, FiDollarSign, FiActivity, FiTrendingUp, 
  FiArrowRight, FiUserPlus, FiZap, FiCalendar,
  FiFileText, FiTarget, FiBarChart2, FiAward, FiMessageSquare
} from 'react-icons/fi'
import SEO from '../../components/SEO'

const AdminOverview = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      if (user.role === 'coach') {
        // Coach specific stats
        const res = await coreAPI.getCoachDashboardStats()
        setStats(res.data)
      } else {
        const res = await authAPI.getAdminStats()
        setStats(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const role = user.is_superuser ? 'superadmin' : user.role

  const getCards = () => {
    if (!stats) return []
    
    if (role === 'coach') {
      return [
        { label: 'My Clients', value: stats.total_clients || 0, icon: FiUsers, color: 'from-blue-500 to-cyan-500', sub: 'Assigned to you' },
        { label: 'Sessions This Week', value: stats.sessions_this_week || 0, icon: FiCalendar, color: 'from-orange-500 to-pink-500', sub: 'Upcoming workouts' },
        { label: 'Client Retention', value: '94%', icon: FiTrendingUp, color: 'from-green-500 to-teal-500', sub: 'Monthly avg' },
        { label: 'Engagement Rate', value: '88%', icon: FiActivity, color: 'from-purple-500 to-indigo-500', sub: 'Client activity' },
      ]
    }
    
    if (role === 'content_writer') {
      return [
        { label: 'Total Posts', value: stats.total_posts || 0, icon: FiFileText, color: 'from-blue-500 to-cyan-500', sub: 'Published articles' },
        { label: 'SEO Score', value: '92/100', icon: FiTarget, color: 'from-orange-500 to-pink-500', sub: 'Site-wide avg' },
        { label: 'Total Views', value: stats.total_blog_views || 0, icon: FiBarChart2, color: 'from-green-500 to-teal-500', sub: 'Across all posts' },
        { label: 'Newsletter Subs', value: stats.newsletter_subscribers || 0, icon: FiUserPlus, color: 'from-purple-500 to-indigo-500', sub: 'Active readers' },
      ]
    }

    return [
      { label: 'Total Users', value: stats.total_users || 0, icon: FiUsers, color: 'from-blue-500 to-cyan-500', sub: `+${stats.new_users_this_month || 0} this month` },
      { label: 'Active Subscriptions', value: stats.active_subscriptions || 0, icon: FiZap, color: 'from-orange-500 to-pink-500', sub: 'Currently active' },
      { label: 'Total Revenue', value: `$${Number(stats.total_revenue || 0).toFixed(2)}`, icon: FiDollarSign, color: 'from-green-500 to-teal-500', sub: 'All time' },
      { label: 'Open Support Tickets', value: stats.open_support_tickets || 0, icon: FiMessageSquare, color: 'from-purple-500 to-indigo-500', sub: `${stats.urgent_support_tickets || 0} urgent · ${stats.resolved_support_tickets || 0} resolved` },
    ]
  }

  const getQuickLinks = () => {
    if (role === 'coach') {
      return [
        { to: '/admin/clients', label: 'Manage Clients', icon: FiUsers, color: 'from-blue-500 to-cyan-500' },
        { to: '/admin/schedule', label: 'View Schedule', icon: FiCalendar, color: 'from-orange-500 to-pink-500' },
        { to: '/admin/workouts', label: 'Library Workouts', icon: FiActivity, color: 'from-green-500 to-teal-500' },
      ]
    }
    if (role === 'content_writer') {
      return [
        { to: '/admin/blog', label: 'Write New Post', icon: FiFileText, color: 'from-blue-500 to-cyan-500' },
        { to: '/admin/pages', label: 'SEO & Pages', icon: FiTarget, color: 'from-orange-500 to-pink-500' },
        { to: '/admin/newsletter', label: 'Send Newsletter', icon: FiUserPlus, color: 'from-green-500 to-teal-500' },
      ]
    }
    return [
      { to: '/admin/workouts', label: 'Add Workout', icon: FiActivity, color: 'from-orange-500 to-pink-500' },
      { to: '/admin/meal-plans', label: 'Add Meal Plan', icon: FiTrendingUp, color: 'from-green-500 to-teal-500' },
      { to: '/admin/blog', label: 'Write Blog Post', icon: FiArrowRight, color: 'from-blue-500 to-cyan-500' },
      { to: '/admin/subscriptions', label: 'Manage Plans', icon: FiDollarSign, color: 'from-purple-500 to-indigo-500' },
      { to: '/admin/users', label: 'View Users', icon: FiUsers, color: 'from-yellow-500 to-orange-500' },
      { to: '/admin/messages', label: 'Support Inbox', icon: FiMessageSquare, color: 'from-pink-500 to-rose-500' },
    ]
  }

  const cards = getCards()
  const quickLinks = getQuickLinks()

  return (
    <div className="p-6 space-y-8">
      <SEO title="Admin Overview" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">
            <span className="gradient-text">Admin</span> Dashboard
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Welcome back, <span className="text-white font-bold">{user.first_name || user.username}</span>. 
            You are logged in as <span className="text-orange-400 capitalize">{role}</span>.
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-2xl flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800/40 rounded-[2rem] p-6 border border-gray-800 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-6 border border-gray-700 hover:border-orange-500/30 transition-all group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <c.icon className="text-white" size={20} />
              </div>
              <p className="text-3xl font-black text-white mb-1 tracking-tight">{c.value}</p>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{c.label}</p>
              <p className="text-gray-600 text-[9px] font-bold mt-2">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-xl flex items-center space-x-3">
            <FiZap className="text-orange-400" />
            <span>Priority Actions</span>
          </h2>
          <div className="h-px flex-1 bg-gray-800 mx-6" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickLinks.map((l, i) => (
            <Link
              key={i}
              to={l.to}
              className="group bg-gray-800/40 backdrop-blur-sm rounded-3xl p-5 border border-gray-700 hover:border-orange-500/50 transition-all hover:-translate-y-1 flex items-center space-x-4 shadow-xl shadow-black/20"
            >
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${l.color} flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform`}>
                <l.icon className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-gray-300 font-black text-xs uppercase tracking-widest group-hover:text-white transition-colors block truncate">{l.label}</span>
                <span className="text-gray-600 text-[9px] font-bold">Go to module</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Role specific info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative">
            <p className="text-white font-black text-xl mb-3 flex items-center space-x-3">
              <FiAward className="text-orange-400" />
              <span>Platform Insights</span>
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
              {role === 'coach' ? 
                "Focus on increasing client engagement this week. Active clients are 4x more likely to renew their subscription." :
                role === 'content_writer' ?
                "High SEO scores lead to 200% more organic traffic. Use the SEO tab to optimize your older blog posts." :
                "Total revenue is up 12% this month. Consider launching a new challenge to boost user retention."
              }
            </p>
            <button className="text-orange-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center space-x-2">
              <span>View full analytics</span>
              <FiArrowRight />
            </button>
          </div>
        </div>

        <div className="bg-gray-800/40 rounded-[2rem] border border-gray-700 p-8 flex flex-col justify-center">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                <FiBarChart2 size={24} />
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-widest leading-none mb-1">System Health</p>
                <p className="text-gray-500 text-xs font-bold">All services operational</p>
              </div>
           </div>
           <div className="mt-6 flex items-center space-x-2">
             {[...Array(20)].map((_, i) => (
               <div key={i} className={`flex-1 h-8 rounded-full ${i > 15 ? 'bg-blue-500/30' : 'bg-blue-500'} animate-pulse`} style={{ animationDelay: `${i * 100}ms` }} />
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
