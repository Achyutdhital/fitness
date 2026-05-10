import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { workoutAPI, authAPI, coreAPI } from '../services/api'
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

  const loadDashboardData = async () => {
    try {
      const [statsRes, todayRes] = await Promise.allSettled([
        authAPI.getDashboardStats(),
        workoutAPI.getTodayWorkout()
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      }

      if (todayRes.status === 'fulfilled') {
        setTodayWorkout(todayRes.value.data)
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
      briefing = `Dominant streak! ${streak} days of pure discipline. Your recovery protocol is now top priority.`;
    } else if (completed_workouts > 10) {
      briefing = `Volume is king. You've conquered ${completed_workouts} sessions. Time to increase the mechanical tension.`;
    } else if (total_calories_burnt > 5000) {
      briefing = `Caloric furnace detected. You've burned over 5k kcal. Your metabolic flexibility is improving.`;
    } else {
      briefing = `Initiate protocol. Your first milestone is 5 completed sessions. The journey to Elite starts now.`;
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
            <Link to="/ai-coach" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2">
              <span>Detailed Analysis</span>
              <FiChevronRight />
            </Link>
          </div>
        </motion.div>

        {/* Welcome Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
              Push <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Further</span>, {user?.first_name || user?.username}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700">
                {subscription?.tier_details?.name || 'Free'} PROTOCOL
              </span>
              <div className="h-4 w-px bg-slate-800" />
              <div className="text-slate-400 text-sm font-bold">
                Rank: <span className="text-orange-400">{stats?.level_name || 'Initiate'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
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
                  <span>Elite Protocol Schedule</span>
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
