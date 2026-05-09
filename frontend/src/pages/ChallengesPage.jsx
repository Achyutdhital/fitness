import React, { useEffect, useState } from 'react'
import { coreAPI } from '../services/api'
import { FiTarget, FiUsers, FiClock, FiCheck, FiZap } from 'react-icons/fi'

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([])
  const [myChallenges, setMyChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [joining, setJoining] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [c, m] = await Promise.all([coreAPI.getChallenges(), coreAPI.getMyChallenges()])
      setChallenges(c.data)
      setMyChallenges(m.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (id) => {
    setJoining(id)
    try {
      await coreAPI.joinChallenge(id)
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setJoining(null)
    }
  }

  const getGoalLabel = (type, value) => {
    const labels = {
      workouts: `${value} workouts`,
      calories: `${value} calories`,
      minutes: `${value} minutes`,
      streak: `${value} day streak`,
    }
    return labels[type] || `${value}`
  }

  const getGoalIcon = (type) => {
    const icons = { workouts: '💪', calories: '🔥', minutes: '⏱️', streak: '📅' }
    return icons[type] || '🎯'
  }

  const daysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const joinedIds = new Set(myChallenges.map(c => c.id))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1">Challenges <span className="gradient-text">& Competitions</span></h1>
          <p className="text-gray-400">Join challenges, compete with others, and earn bonus points</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8">
          {[
            { id: 'active', label: `Active Challenges (${challenges.length})` },
            { id: 'mine', label: `My Challenges (${myChallenges.length})` },
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

        {/* Active Challenges */}
        {tab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => {
              const joined = joinedIds.has(challenge.id)
              const days = daysLeft(challenge.end_date)
              return (
                <div key={challenge.id} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-all overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">{challenge.icon}</span>
                      <div className="flex items-center space-x-1 text-gray-400 text-sm">
                        <FiClock size={14} />
                        <span>{days} days left</span>
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-1">{challenge.title}</h3>
                    <p className="text-gray-400 text-sm">{challenge.description}</p>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-gray-300 text-sm">
                        <span>{getGoalIcon(challenge.goal_type)}</span>
                        <span>Goal: {getGoalLabel(challenge.goal_type, challenge.goal_value)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-orange-400 text-sm font-bold">
                        <FiZap size={14} />
                        <span>+{challenge.reward_points} pts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-gray-400 text-sm">
                      <div className="flex items-center space-x-1">
                        <FiUsers size={14} />
                        <span>{challenge.participant_count} participants</span>
                      </div>
                    </div>

                    {joined ? (
                      <div className="flex items-center justify-center space-x-2 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 font-semibold text-sm">
                        <FiCheck size={16} />
                        <span>Joined</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(challenge.id)}
                        disabled={joining === challenge.id}
                        className="w-full btn btn-primary text-sm py-3"
                      >
                        {joining === challenge.id ? 'Joining...' : 'Join Challenge'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* My Challenges */}
        {tab === 'mine' && (
          <div className="space-y-4">
            {myChallenges.length === 0 ? (
              <div className="text-center py-16">
                <FiTarget className="text-gray-600 mx-auto mb-4" size={48} />
                <p className="text-gray-400 text-lg mb-4">You haven't joined any challenges yet</p>
                <button onClick={() => setTab('active')} className="btn btn-primary">Browse Challenges</button>
              </div>
            ) : myChallenges.map(challenge => {
              const progressPct = Math.min((challenge.my_progress / challenge.goal_value) * 100, 100)
              return (
                <div key={challenge.id} className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{challenge.icon}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">{challenge.title}</h3>
                        <p className="text-gray-400 text-sm">{challenge.description}</p>
                      </div>
                    </div>
                    {challenge.completed && (
                      <span className="bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-1 rounded-full text-xs font-bold">
                        ✅ Completed
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-bold">{challenge.my_progress} / {challenge.goal_value}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{progressPct.toFixed(0)}% complete · +{challenge.reward_points} pts reward</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChallengesPage
