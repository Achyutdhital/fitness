import React, { useEffect, useState } from 'react'
import { coreAPI } from '../services/api'
import { FiAward, FiStar, FiTrendingUp, FiZap } from 'react-icons/fi'

const AchievementsPage = () => {
  const [stats, setStats] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('achievements')

  useEffect(() => {
    Promise.all([
      coreAPI.getMyStats(),
      coreAPI.getAllAchievements(),
      coreAPI.getLeaderboard(),
    ]).then(([s, a, l]) => {
      setStats(s.data)
      setAchievements(a.data)
      setLeaderboard(l.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
    </div>
  )

  const earned = achievements.filter(a => a.earned)
  const locked = achievements.filter(a => !a.earned)
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500]
  const currentPoints = stats?.points?.total_points || 0
  const level = stats?.points?.level || 1
  const nextThreshold = levelThresholds[level] || 2500
  const prevThreshold = levelThresholds[level - 1] || 0
  const progress = Math.min(((currentPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1">Achievements <span className="gradient-text">& Rewards</span></h1>
          <p className="text-gray-400">Earn points, level up, and unlock achievements as you train</p>
        </div>

        {/* Level Card */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white/70 text-sm mb-1">Level</p>
              <p className="text-5xl font-black text-white">{level}</p>
              <p className="text-white/80 text-sm">{stats?.points?.level_name}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Total Points</p>
              <p className="text-5xl font-black text-white">{currentPoints}</p>
              <p className="text-white/80 text-sm">{stats?.points?.points_to_next_level} to next level</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Current Streak</p>
              <p className="text-5xl font-black text-white">{stats?.points?.streak_days || 0}</p>
              <p className="text-white/80 text-sm">days</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Achievements</p>
              <p className="text-5xl font-black text-white">{stats?.earned_count || 0}</p>
              <p className="text-white/80 text-sm">of {stats?.total_achievements || 0} earned</p>
            </div>
          </div>
          <div className="relative z-10 mt-6">
            <div className="flex justify-between text-white/70 text-xs mb-2">
              <span>Level {level}</span>
              <span>Level {level + 1}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'achievements', label: `Achievements (${earned.length})` },
            { id: 'locked', label: `Locked (${locked.length})` },
            { id: 'leaderboard', label: 'Leaderboard' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {tab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <FiAward className="text-gray-600 mx-auto mb-4" size={48} />
                <p className="text-gray-400 text-lg">No achievements yet — complete your first workout!</p>
              </div>
            ) : earned.map(a => (
              <div key={a.id} className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/40 rounded-2xl p-6 flex items-start space-x-4">
                <div className="text-4xl flex-shrink-0">{a.icon}</div>
                <div>
                  <h3 className="text-white font-bold text-lg">{a.name}</h3>
                  <p className="text-gray-300 text-sm mb-2">{a.description}</p>
                  <span className="bg-orange-500/30 text-orange-300 text-xs px-3 py-1 rounded-full font-bold">
                    +{a.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Locked Achievements */}
        {tab === 'locked' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map(a => (
              <div key={a.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex items-start space-x-4 opacity-60">
                <div className="text-4xl flex-shrink-0 grayscale">{a.icon}</div>
                <div>
                  <h3 className="text-gray-300 font-bold text-lg">{a.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{a.description}</p>
                  <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full font-bold">
                    +{a.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {tab === 'leaderboard' && (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-white font-bold text-xl">Top Members This Month</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {leaderboard.map((entry, i) => (
                <div key={i} className={`flex items-center space-x-4 p-4 ${i < 3 ? 'bg-gradient-to-r from-orange-500/5 to-transparent' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500 text-black' :
                    i === 1 ? 'bg-gray-400 text-black' :
                    i === 2 ? 'bg-orange-700 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{entry.first_name || entry.username}</p>
                    <p className="text-gray-400 text-xs">{entry.level_name} · {entry.streak_days} day streak</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-black">{entry.total_points}</p>
                    <p className="text-gray-500 text-xs">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AchievementsPage
