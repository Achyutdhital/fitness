import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { workoutAPI, authAPI, coreAPI, aiAPI } from '../services/api'
import { 
  FiTrendingUp, FiActivity, FiTarget, FiAward, 
  FiCalendar, FiZap, FiHeart, FiClock, 
  FiArrowRight, FiCheck, FiVideo, FiAlertCircle, FiChevronRight
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import AdRewardModal from '../components/AdRewardModal'

const DashboardPage = () => {
  const { user, subscription, fetchUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdModalOpen, setIsAdModalOpen] = useState(false)
  const [reminder, setReminder] = useState(null)
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [aiBriefing, setAiBriefing] = useState("")
  const [leaderboard, setLeaderboard] = useState([])
  const [analysisData, setAnalysisData] = useState(null)
  const [liveWorkout, setLiveWorkout] = useState(null)
  const [aiQuota, setAiQuota] = useState(null)
  
  useEffect(() => {
    loadDashboardData()
    checkReminders()
    loadLeaderboard()
  }, [user])

  useEffect(() => {
    if (stats) {
      generateAIBriefing()
    }
  }, [stats])

  const activeWorkout = useMemo(() => {
    return todayWorkout?.workout || stats?.recent_workouts?.[0]?.workout || recommendations[0] || null
  }, [todayWorkout, stats, recommendations])

  const dashboardInsights = useMemo(() => {
    if (!stats) return []

    const completedWorkouts = stats.completed_workouts || 0
    const totalDurationMinutes = stats.total_duration_minutes || 0
    const streakDays = stats.streak || 0
    const weeklyActivity = stats.weekly_activity || []
    const activeDays = weeklyActivity.filter((day) => day.done).length
    const averageSession = completedWorkouts ? Math.round(totalDurationMinutes / completedWorkouts) : 0
    const lastWorkoutTitle = stats?.recent_workouts?.[0]?.workout?.title

    return [
      streakDays >= 3
        ? `You have a ${streakDays}-day streak. Keep the same cadence and protect recovery.`
        : 'Build a 3-day streak before chasing more volume.',
      lastWorkoutTitle
        ? `Continue where you left off with ${lastWorkoutTitle}. Add 1 set or 2 reps on the main lift.`
        : 'Complete your first tracked workout so progression can start adapting automatically.',
      totalDurationMinutes >= 180
        ? `You trained for about ${Math.round(totalDurationMinutes / 60)} hours. A mobility or zone-2 day would balance the load.`
        : `You have ${activeDays} active training days this week. Aim for one more quality session.`,
      averageSession
        ? `Average session length is ${averageSession} minutes. Use that to keep your weekly workload consistent.`
        : 'Log a few completed workouts to unlock deeper AI guidance.',
    ]
  }, [stats])

  const loadDashboardData = async () => {
    try {
      const [statsRes, todayRes, analysisRes, progressRes] = await Promise.allSettled([
        authAPI.getDashboardStats(),
        workoutAPI.getTodayWorkout(),
        aiAPI.analyzeAndSuggest(),
        workoutAPI.getProgress()
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      }

      if (todayRes.status === 'fulfilled') {
        setTodayWorkout(todayRes.value.data)
      }

      if (analysisRes.status === 'fulfilled') {
        setAnalysisData(analysisRes.value.data)
      }

      const quotaRes = await aiAPI.getQuota().catch(() => null)
      if (quotaRes?.data?.quota) {
        setAiQuota(quotaRes.data.quota)
      }

      if (progressRes.status === 'fulfilled') {
        const active = progressRes.value.data.find(p => p.status === 'in_progress')
        setLiveWorkout(active)
      }

      const recRes = await workoutAPI.getWorkouts({ limit: 3 })
      setRecommendations(recRes.data.results || recRes.data || [])

    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await coreAPI.getLeaderboard();
      setLeaderboard(response.data.slice(0, 3));
    } catch (error) {
      console.error('Failed to load leaderboard');
    }
  }

  const checkReminders = async () => {
    try {
      const response = await coreAPI.checkReminders()
      if (response.data.remind) {
        setReminder(response.data)
      }
    } catch (e) {
      console.error('Failed to check reminders')
    }
  }

  const generateAIBriefing = () => {
    if (!stats) return;
    
    const { completed_workouts, total_calories_burnt, streak } = stats;
    let briefing = "Analyze your performance to unlock elite insights.";

    if (streak > 3) {
      briefing = `Dominant streak! ${streak} days of pure discipline. Your recovery pkg is now top priority.`;
    } else if (completed_workouts > 10) {
      briefing = `Volume is king. You've conquered ${completed_workouts} sessions. Time to increase the mechanical tension.`;
    } else if (total_calories_burnt > 5000) {
      briefing = `Caloric furnace detected. You've burned over 5k kcal. Your metabolic flexibility is improving.`;
    } else {
      briefing = `Initiate pkg. Your first milestone is 5 completed sessions. The journey to Elite starts now.`;
    }
    
    setAiBriefing(briefing);
  }

  const isFreeTier = !subscription?.tier_details || subscription.tier_details.name.toLowerCase() === 'free'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  const statCards = [
    { label: 'Workouts Done', value: stats?.completed_workouts || 0, icon: FiActivity, color: 'from-orange-500 to-pink-500', change: '+3 this week' },
    { label: 'Calories Burned', value: stats?.total_calories_burnt || 0, icon: FiZap, color: 'from-green-500 to-teal-500', change: '+250 today' },
    { label: 'Hours Trained', value: `${Math.round((stats?.total_duration_minutes || 0) / 60)}h`, icon: FiClock, color: 'from-blue-500 to-cyan-500', change: '+2h this week' },
    { label: 'Day Streak', value: stats?.streak || 0, icon: FiAward, color: 'from-purple-500 to-indigo-500', change: 'Personal best!' },
  ]

  const detailCards = [
    { label: 'Average Session', value: stats?.completed_workouts ? `${Math.round((stats?.total_duration_minutes || 0) / stats.completed_workouts)} min` : '--', icon: FiClock, color: 'from-slate-500 to-slate-600' },
    { label: 'Active Days', value: stats?.weekly_activity?.filter((day) => day.done)?.length || 0, icon: FiCalendar, color: 'from-blue-500 to-indigo-500' },
    { label: 'Achievements', value: stats?.achievements_count || 0, icon: FiAward, color: 'from-pink-500 to-rose-500' },
    { label: 'Unread Alerts', value: stats?.unread_notifications || 0, icon: FiVideo, color: 'from-amber-500 to-orange-500' },
  ]

  const insightCards = stats?.insight_cards || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Vitality...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4"
      >
        {/* Live Tracking Status (Moved to top as a priority banner) */}
        {liveWorkout && (
          <motion.div 
            variants={itemVariants}
            className="mb-12 bg-orange-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-orange-500/40"
          >
            <div className="absolute -right-4 -top-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                  <FiActivity size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Link Active</span>
                  </div>
                  <h3 className="text-3xl font-black">{liveWorkout.workout_title}</h3>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Started at {new Date(liveWorkout.started_at).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <Link 
                to={`/workouts/${liveWorkout.workout}`}
                className="px-12 py-5 bg-white text-orange-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.05] shadow-xl"
              >
                Resume Performance log
              </Link>
            </div>
          </motion.div>
        )}

        {/* Subscription Warning */}
        {subscription?.is_expiring_soon && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <FiAlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-widest">Package Expiring Soon</h4>
                <p className="text-red-400 text-xs font-bold mt-1">
                  Your {subscription?.is_custom 
                    ? `Custom (${subscription?.custom_config?.sessions_per_week}x${subscription?.custom_config?.session_duration_minutes}min)` 
                    : subscription?.tier_details?.name} access ends on {new Date(subscription?.end_date).toLocaleDateString()}. Renew now to maintain progress.
                </p>
              </div>
            </div>
            <Link 
              to="/subscriptions"
              className="px-8 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.05]"
            >
              Renew pkg Now
            </Link>
          </motion.div>
        )}

        {/* Elite AI Briefing */}
        <motion.div 
          variants={itemVariants}
          className="mb-12 p-1 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-blue-500/20 rounded-[2rem]"
        >
          <div className="bg-[#0f172a]/90 backdrop-blur-xl rounded-[1.9rem] p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 flex-shrink-0">
               <FiZap size={32} />
            </div>
            <div className="flex-grow text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1 block">Daily AI Intelligence Briefing</span>
              <p className="text-white text-lg font-bold leading-tight">
                "{aiBriefing}"
              </p>
            </div>
            {isFreeTier ? (
              <Link to="/subscriptions" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
                <span>Unlock Basic Package</span>
                <FiZap />
              </Link>
            ) : (
              <Link to="/coaching" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2">
                <span>1-on-1 Coaching</span>
                <FiChevronRight />
              </Link>
            )}
          </div>
        </motion.div>

        {aiQuota && (
          <motion.div
            variants={itemVariants}
            className="mb-12 grid gap-4 md:grid-cols-3"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-orange-400 font-black">AI Coach Quota</p>
                  <h3 className="text-white text-lg font-black">Messages remaining today</h3>
                </div>
                <FiZap className="text-orange-400" size={20} />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-white">
                    {aiQuota.daily_remaining}
                    <span className="text-slate-500 text-lg font-bold"> / {aiQuota.daily_limit}</span>
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Monthly: {aiQuota.monthly_remaining} / {aiQuota.monthly_limit} remaining
                  </p>
                </div>
                <Link
                  to="/subscriptions"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest transition-all"
                >
                  Upgrade
                </Link>
              </div>
              <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                  style={{ width: `${Math.min(100, ((aiQuota.daily_limit - aiQuota.daily_remaining) / aiQuota.daily_limit) * 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black">Reset</p>
                <p className="text-white font-bold mt-1">Daily at midnight UTC</p>
                <p className="text-slate-400 text-sm mt-1">Monthly resets on the 1st</p>
              </div>
              <FiClock className="text-slate-500" size={20} />
            </div>
          </motion.div>
        )}

        {/* Welcome Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
              Push <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Further</span>, {user?.first_name || user?.username}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700">
                {subscription?.is_custom 
                  ? `Custom (${subscription?.custom_config?.sessions_per_week}x${subscription?.custom_config?.session_duration_minutes}min)` 
                  : subscription?.tier_details?.name || 'Free'} Package
              </span>
              <div className="h-4 w-px bg-slate-800" />
              <div className="text-slate-400 text-sm font-bold">
                Rank: <span className="text-orange-400">{stats?.level_name || 'Initiate'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             {isFreeTier && (
               <button 
                onClick={() => setIsAdModalOpen(true)}
                className="px-6 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3"
               >
                  <FiVideo />
                  <span>Earn Points</span>
               </button>
             )}
             <Link to="/workouts" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3">
                <FiZap />
                <span>Start Training</span>
             </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-800/50 hover:border-orange-500/30 transition-all relative overflow-hidden group"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                   <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-4xl font-black text-white mb-1 tracking-tight">{stat.value}</p>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {detailCards.map((card, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-slate-900/40 backdrop-blur-xl rounded-[1.75rem] p-6 border border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                  <card.icon size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live metric</span>
              </div>
              <p className="text-3xl font-black text-white tracking-tight">{card.value}</p>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Resume + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">Continue Where You Left Off</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Resume the next best session</p>
              </div>
              <FiArrowRight className="text-orange-400" />
            </div>

            {activeWorkout ? (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">
                    {todayWorkout?.workout ? 'Today\'s Session' : 'Recommended Next'}
                  </p>
                  <h3 className="text-2xl font-black text-white mb-2">{activeWorkout.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {activeWorkout.description || 'Pick up from your last completed effort and push the next progression step.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4">
                    <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Workouts</p>
                    <p className="text-white text-2xl font-black">{stats?.completed_workouts || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
                    <p className="text-green-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Time</p>
                    <p className="text-white text-2xl font-black">{Math.round((stats?.total_duration_minutes || 0) / 60)}h</p>
                  </div>
                </div>

                <Link
                  to={`/workouts/${activeWorkout.id}`}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-500/20"
                >
                  <span>{todayWorkout?.workout ? 'Commence Session' : 'Resume Plan'}</span>
                  <FiChevronRight />
                </Link>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No workout is available to resume yet. Start a session from the workout library.</div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">AI Overview</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Auto-generated from your training history</p>
              </div>
              <FiZap className="text-orange-400" />
            </div>

            <div className="space-y-4">
              {dashboardInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 p-4">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiCheck size={14} />
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Chart - Activity */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white">Performance Metrics</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Energy Output (7D)</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Calories</button>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.weekly_activity || []}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }}
                    itemStyle={{ color: '#f97316', fontWeight: 900 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#f97316" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCal)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Weight Evolution Chart */}
          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white">Bio-Trends</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Weight Evolution</p>
            </div>

            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.measurement_history || []}>
                  <XAxis 
                    dataKey="date" 
                    hide
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }}
                    labelStyle={{ color: '#64748b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    animationDuration={2500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
               <div className="flex items-center justify-between mb-1">
                 <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Current Weight</span>
                 <span className="text-white font-black">{stats?.measurement_history?.slice(-1)[0]?.weight || user?.weight || '--'} kg</span>
               </div>
               <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="h-full bg-blue-500" 
                  />
               </div>
            </div>
          </motion.div>
        </div>

        {/* Training Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
           <motion.div 
              variants={itemVariants}
              className="lg:col-span-2"
           >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <FiCalendar className="text-orange-500" />
                  <span>Elite pkg Schedule</span>
                </h2>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div 
                      key={day}
                      className={`p-4 rounded-2xl border transition-all ${
                        isToday 
                        ? 'bg-gradient-to-b from-orange-500 to-pink-600 border-transparent shadow-xl' 
                        : 'bg-slate-900/40 border-slate-800/50'
                      }`}
                    >
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 text-center ${isToday ? 'text-white' : 'text-slate-500'}`}>{day}</p>
                      <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${isToday ? 'bg-white/20' : 'bg-slate-800/50 text-slate-600'}`}>
                        {isToday ? <FiZap /> : <FiClock />}
                      </div>
                    </div>
                  )
                })}
              </div>
           </motion.div>

           <motion.div variants={itemVariants}>
             <div className="mb-8">
               <h2 className="text-2xl font-black text-white">Target Focus</h2>
             </div>
             {todayWorkout?.workout ? (
                <div className="bg-slate-900 border border-orange-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 text-orange-500/10 -mr-4 -mt-4">
                      <FiTarget size={120} />
                   </div>
                   <div className="relative z-10">
                     <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                        {todayWorkout.phase_name || 'Active Phase'}
                     </span>
                     <h3 className="text-2xl font-black text-white mb-2 leading-tight">{todayWorkout.workout.title}</h3>
                     <p className="text-slate-500 text-sm mb-6 line-clamp-2">Precision engineered session for your current objectives.</p>
                     <Link to={`/workouts/${todayWorkout.workout.id}`} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all block text-center">
                        Commence Session
                     </Link>
                   </div>
                </div>
             ) : (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] p-12 text-center">
                   <p className="text-slate-500 font-bold mb-4">No Session Scheduled</p>
                   <Link to="/workouts" className="text-orange-400 text-xs font-black uppercase tracking-widest hover:text-orange-300">Browse Archives →</Link>
                </div>
             )}
           </motion.div>
        </div>

        {/* Neural Analysis Engine - Moved to Bottom */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[3rem] p-12 border border-white/5 relative overflow-hidden mb-12 group shadow-2xl"
        >
          {/* Animated Background Gradients */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] -z-10 rounded-full animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 blur-[150px] -z-10 rounded-full" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    {analysisData?.model_name || 'Neural Performance Engine'}
                   </div>
                   {analysisData?.is_premium_engine && (
                     <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1">
                        <FiAward size={10} />
                        <span>Elite Core</span>
                     </div>
                   )}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Transformation</span> Path
                </h2>
                <p className="text-slate-400 text-sm font-bold mt-2 max-w-xl">
                  Our proprietary ML model continuously scans your bio-metrics and performance data to architect your optimal progression route.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Engine Status</p>
                   <p className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-end gap-2">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                     Live Tracking
                   </p>
                </div>
                <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-500">
                  <FiTrendingUp size={32} />
                </div>
              </div>
            </div>

            {analysisData ? (
              analysisData.is_locked ? (
                <div className="relative group/locked">
                  {/* Blurred Preview Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 opacity-20 blur-xl pointer-events-none select-none">
                    <div className="lg:col-span-5 space-y-8">
                       <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Diagnostic Signals</p>
                          <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20" />
                                <div className="flex-grow">
                                   <div className="h-4 bg-slate-800 rounded w-full mb-2" />
                                   <div className="w-32 h-1 bg-slate-800 rounded-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 h-24" />
                          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 h-24" />
                       </div>
                    </div>
                    <div className="lg:col-span-7 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-3xl p-10" />
                  </div>

                  {/* Lock Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="max-w-md w-full bg-[#0f172a]/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 text-center shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full" />
                      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 blur-3xl rounded-full" />
                      
                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-blue-500/40">
                           <FiZap size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Advanced Neural Core Locked</h3>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8">
                          {analysisData.message || "Upgrade to the Pro Protocol to unlock predictive metabolic modeling and advanced neural load analysis."}
                        </p>
                        
                        <div className="space-y-3 mb-10">
                           {(analysisData.preview_signals || ['Metabolic Profiling', 'Neural Modeling']).map((sig) => (
                             <div key={sig} className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                <FiCheck size={12} />
                                <span>{sig}</span>
                             </div>
                           ))}
                        </div>

                        <Link 
                          to="/subscriptions" 
                          className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-blue-500 hover:text-white block shadow-xl"
                        >
                           Unlock Pro Protocol
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Visual Data Column */}
                  <div className="lg:col-span-5 space-y-8">
                     <div className="bg-white/5 rounded-3xl p-8 border border-white/10 relative overflow-hidden group/card">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Diagnostic Signals</p>
                        <div className="space-y-6">
                          {analysisData.analysis?.length > 0 ? analysisData.analysis.map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                 {i === 0 ? <FiActivity size={14} /> : <FiZap size={14} />}
                              </div>
                              <div>
                                 <p className="text-white text-sm font-bold leading-tight">{item}</p>
                                 <div className="w-32 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: '85%' }}
                                      transition={{ duration: 1, delay: i * 0.2 }}
                                      className="h-full bg-blue-500" 
                                    />
                                 </div>
                              </div>
                            </div>
                          )) : (
                            <div className="text-slate-500 text-sm italic">Synchronizing with initial data points...</div>
                          )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Model Score</p>
                           <p className="text-white text-3xl font-black">{analysisData.model_score || 65}</p>
                           <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black">Readiness / 100</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">Signal Confidence</p>
                           <p className="text-white text-3xl font-black">{Math.round((analysisData.model_confidence || 0.85) * 100)}%</p>
                           <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black">High Accuracy</p>
                        </div>
                     </div>
                  </div>

                  {/* Recommendation Column */}
                  <div className="lg:col-span-7 flex flex-col">
                     <div className="flex-grow bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-3xl p-10 border border-blue-500/30 shadow-inner">
                        <div className="flex items-center gap-3 mb-6">
                           <FiTarget className="text-orange-400" size={24} />
                           <span className="text-orange-400 text-[10px] font-black uppercase tracking-[0.3em]">Neural Recommendation</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-6 leading-tight">
                           "{analysisData.suggested_solution}"
                        </h3>
                        
                        <div className="space-y-4 mb-8">
                           {analysisData.supporting_signals?.map((signal, i) => (
                             <div key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                                <FiCheck className="text-emerald-400 flex-shrink-0" />
                                <span>{signal}</span>
                             </div>
                           ))}
                        </div>

                        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                           <div>
                              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Next Protocol Action</p>
                              <p className="text-blue-400 text-sm font-black uppercase tracking-[0.1em]">{analysisData.next_step}</p>
                           </div>
                           <Link 
                             to="/workouts" 
                             className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl"
                           >
                              Execute Phase
                           </Link>
                        </div>
                     </div>
                  </div>
                </div>
              )
            ) : (
              <div className="py-24 text-center">
                 <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
                 <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Warming Up Neural Core</h3>
                 <p className="text-slate-500 text-sm font-bold">Synchronizing metabolic history and performance snapshots...</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800/50 mb-12"
        >
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <FiAward className="text-blue-500" />
                <span>Elite 1% Leaderboard</span>
             </h2>
             <Link to="/achievements" className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest">Full Rankings</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {leaderboard.length > 0 ? leaderboard.map((player) => (
                <div key={player.rank} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${player.rank === 1 ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {player.rank}
                   </div>
                   <div>
                      <p className="text-white font-bold text-sm truncate max-w-[120px]">{player.first_name || player.username}</p>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{player.total_points} XP Earned</p>
                   </div>
                </div>
             )) : (
               <div className="col-span-3 text-center py-4 text-slate-600 text-sm italic">
                  Rankings being recalculated...
               </div>
             )}
          </div>
        </motion.div>
      </motion.div>

      <AdRewardModal 
        isOpen={isAdModalOpen} 
        onClose={() => setIsAdModalOpen(false)} 
        onReward={() => {
          loadDashboardData()
          fetchUser()
        }}
      />
    </div>
  )
}

export default DashboardPage
