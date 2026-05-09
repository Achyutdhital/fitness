import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { workoutAPI, paymentAPI, authAPI } from '../services/api'
import { FiTrendingUp, FiActivity, FiTarget, FiAward, FiCalendar, FiZap, FiHeart, FiClock, FiArrowRight, FiCheck } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const DashboardPage = () => {
  const { user, subscription } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayWorkouts] = useState([
    { time: '7:00 AM', name: 'Morning Cardio', duration: '30 min', done: true },
    { time: '12:00 PM', name: 'Core Strength', duration: '20 min', done: false },
    { time: '6:00 PM', name: 'Evening Yoga', duration: '45 min', done: false },
  ])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, progressRes] = await Promise.allSettled([
        authAPI.getDashboardStats(),
        workoutAPI.getProgress(),
      ])

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data
        setStats({
          completed_workouts: d.completed_workouts,
          total_calories_burnt: d.total_calories_burnt,
          total_duration_minutes: d.total_duration_minutes,
          streak: d.streak,
          total_points: d.total_points,
          level: d.level,
          level_name: d.level_name,
        })
        setRecentWorkouts(d.recent_workouts || [])
      } else {
        // fallback
        const [s, p] = await Promise.allSettled([workoutAPI.getStats(), workoutAPI.getProgress()])
        if (s.status === 'fulfilled') setStats(s.value.data)
        if (p.status === 'fulfilled') setRecentWorkouts((p.value.data.results || p.value.data || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Workouts Done',
      value: stats?.completed_workouts || 0,
      icon: FiActivity,
      color: 'from-orange-500 to-pink-500',
      change: '+3 this week',
    },
    {
      label: 'Calories Burned',
      value: `${stats?.total_calories_burnt || 0}`,
      icon: FiZap,
      color: 'from-green-500 to-teal-500',
      change: '+250 today',
    },
    {
      label: 'Hours Trained',
      value: `${Math.round((stats?.total_duration_minutes || 0) / 60)}h`,
      icon: FiClock,
      color: 'from-blue-500 to-cyan-500',
      change: '+2h this week',
    },
    {
      label: 'Day Streak',
      value: stats?.streak || 7,
      icon: FiAward,
      color: 'from-purple-500 to-indigo-500',
      change: 'Personal best!',
    },
  ]

  const weeklyProgress = [
    { day: 'Mon', done: true, calories: 320 },
    { day: 'Tue', done: true, calories: 450 },
    { day: 'Wed', done: true, calories: 280 },
    { day: 'Thu', done: false, calories: 0 },
    { day: 'Fri', done: true, calories: 510 },
    { day: 'Sat', done: false, calories: 0 },
    { day: 'Sun', done: false, calories: 0 },
  ]

  const maxCalories = Math.max(...weeklyProgress.map(d => d.calories), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="container">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
              Welcome back, <span className="gradient-text">{user?.first_name || user?.username}!</span> 👋
            </h1>
            <p className="text-gray-400">
              {subscription?.subscription_plan?.name || 'Free'} Plan
              {subscription?.end_date && ` · Active until ${new Date(subscription.end_date).toLocaleDateString()}`}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link to="/workouts" className="btn btn-primary flex items-center space-x-2">
              <FiZap size={18} />
              <span>Start Workout</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-orange-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <span className="text-green-400 text-xs font-medium bg-green-500/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-4xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Weekly Progress Chart */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Weekly Activity</h2>
              <span className="text-gray-400 text-sm">This Week</span>
            </div>

            <div className="flex items-end justify-between h-40 mb-4">
              {weeklyProgress.map((day, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 flex-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                    <div
                      className={`w-8 rounded-t-lg transition-all duration-500 ${
                        day.done
                          ? 'bg-gradient-to-t from-orange-500 to-pink-500'
                          : 'bg-gray-700'
                      }`}
                      style={{ height: day.done ? `${(day.calories / maxCalories) * 100}%` : '10%' }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${day.done ? 'text-orange-400' : 'text-gray-600'}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" />
                <span>Workout done</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-700" />
                <span>Rest day</span>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Today's Plan</h2>
              <FiCalendar className="text-orange-400" size={20} />
            </div>

            <div className="space-y-4">
              {todayWorkouts.map((workout, i) => (
                <div key={i} className={`flex items-center space-x-4 p-3 rounded-xl transition-all ${workout.done ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900 border border-gray-700'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${workout.done ? 'bg-green-500' : 'bg-gray-700'}`}>
                    {workout.done ? <FiCheck className="text-white" size={16} /> : <FiClock className="text-gray-400" size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${workout.done ? 'text-green-400 line-through' : 'text-white'}`}>
                      {workout.name}
                    </p>
                    <p className="text-gray-500 text-xs">{workout.time} · {workout.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/workouts" className="btn btn-primary w-full mt-6 text-center block text-sm">
              View All Workouts
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Workouts */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Recent Activity</h2>
              <Link to="/workouts" className="text-orange-400 text-sm hover:text-orange-300 flex items-center space-x-1">
                <span>View all</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            {recentWorkouts.length > 0 ? (
              <div className="space-y-4">
                {recentWorkouts.map((workout, i) => (
                  <div key={workout.id || i} className="flex items-center space-x-4 p-3 bg-gray-900 rounded-xl border border-gray-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiActivity className="text-white" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{workout.workout_title || 'Workout'}</p>
                      <p className="text-gray-500 text-xs">{new Date(workout.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 text-sm font-bold">{workout.calories_burnt || 0} cal</p>
                      <p className="text-gray-500 text-xs">{workout.duration_minutes || 0} min</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiActivity className="text-gray-600 mx-auto mb-3" size={40} />
                <p className="text-gray-400 mb-4">No workouts yet</p>
                <Link to="/workouts" className="btn btn-primary text-sm">
                  Start Your First Workout
                </Link>
              </div>
            )}
          </div>

          {/* Goals & Quick Actions */}
          <div className="space-y-6">
            {/* Goal Progress */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-white font-bold text-xl mb-6">Goal Progress</h2>
              <div className="space-y-4">
                {[
                  { label: 'Weekly Workouts', current: 4, target: 5, color: 'from-orange-500 to-pink-500' },
                  { label: 'Calories Burned', current: 1560, target: 2000, color: 'from-green-500 to-teal-500' },
                  { label: 'Active Minutes', current: 180, target: 300, color: 'from-blue-500 to-cyan-500' },
                ].map((goal, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">{goal.label}</span>
                      <span className="text-gray-400">{goal.current}/{goal.target}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${goal.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-white font-bold text-xl mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Browse Workouts', to: '/workouts', icon: FiActivity, color: 'from-orange-500 to-pink-500' },
                  { label: 'Meal Plans', to: '/meal-plans', icon: FiHeart, color: 'from-green-500 to-teal-500' },
                  { label: 'My Profile', to: '/profile', icon: FiTarget, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Upgrade Plan', to: '/subscriptions', icon: FiTrendingUp, color: 'from-purple-500 to-indigo-500' },
                ].map((action, i) => (
                  <Link
                    key={i}
                    to={action.to}
                    className="group flex flex-col items-center p-4 bg-gray-900 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-all hover:-translate-y-1"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                      <action.icon className="text-white" size={18} />
                    </div>
                    <span className="text-gray-300 text-xs text-center font-medium group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
