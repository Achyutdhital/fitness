import React, { useEffect, useState } from 'react'
import api, { coreAPI } from '../services/api'
import { FiUsers, FiCalendar, FiEdit3, FiActivity, FiSearch, FiVideo, FiDollarSign } from 'react-icons/fi'

const CoachDashboard = () => {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [payoutSummary, setPayoutSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [scheduleForm, setScheduleForm] = useState({ client_id: '', scheduled_at: '', duration_minutes: 30 })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [clientsRes, sessionsRes] = await Promise.all([
        coreAPI.getCoachClients(),
        api.get('/core/sessions/my_sessions/')
      ])
      setClients(clientsRes.data)
      setSessions(sessionsRes.data)
      const payoutRes = await coreAPI.getCoachPayoutSummary().catch(() => null)
      if (payoutRes?.data) {
        setPayoutSummary(payoutRes.data)
      }
    } catch (error) {
      console.error('Failed to load coach data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startMeeting = (clientId) => {
    // Generate a unique Jitsi meeting link
    const roomName = `FitCoachPro-Session-${clientId}-${Date.now()}`
    const meetingUrl = `https://meet.jit.si/${roomName}`
    window.open(meetingUrl, '_blank')
  }

  const scheduleSession = async (e) => {
    e.preventDefault()
    if (!scheduleForm.client_id || !scheduleForm.scheduled_at) return
    try {
      await coreAPI.createSession(scheduleForm)
      setScheduleForm({ client_id: '', scheduled_at: '', duration_minutes: 30 })
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to schedule session', error)
      alert(error?.response?.data?.error || 'Failed to schedule session')
    }
  }

  const respondToSession = async (sessionId, decision) => {
    try {
      await coreAPI.respondSession(sessionId, { decision })
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to update session', error)
      alert(error?.response?.data?.error || 'Failed to update session')
    }
  }

  const filteredClients = clients.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Coach Dashboard</h1>
            <p className="text-gray-400 font-medium">Manage your assigned clients and their personalized plans.</p>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white w-full md:w-80 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FiUsers size={24} />
              </div>
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total Clients</span>
            </div>
            <span className="text-4xl font-black text-white">{clients.length}</span>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                <FiCalendar size={24} />
              </div>
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sessions Today</span>
            </div>
            <span className="text-4xl font-black text-white">0</span>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                <FiActivity size={24} />
              </div>
              <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Pending Reviews</span>
            </div>
            <span className="text-4xl font-black text-white">0</span>
          </div>
        </div>

        {payoutSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <FiDollarSign size={24} />
                </div>
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Payouts Pending</span>
              </div>
              <span className="text-4xl font-black text-white">${Number(payoutSummary.summary.pending_total || 0).toFixed(2)}</span>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                  <FiDollarSign size={24} />
                </div>
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Payouts Paid</span>
              </div>
              <span className="text-4xl font-black text-white">${Number(payoutSummary.summary.paid_total || 0).toFixed(2)}</span>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <FiDollarSign size={24} />
                </div>
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total Earned</span>
              </div>
              <span className="text-4xl font-black text-white">${Number(payoutSummary.summary.combined_total || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Clients Table */}
        <div className="bg-gray-800/50 rounded-3xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Clients</h2>
            <button className="text-orange-400 text-sm font-bold hover:text-orange-300 transition-colors">View All History</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-900/50 text-gray-500 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Fitness Level</th>
                  <th className="px-6 py-4">Goal</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                          {client.first_name?.[0] || client.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold">{client.first_name} {client.last_name}</p>
                          <p className="text-gray-500 text-xs">@{client.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                        {client.fitness_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">{client.fitness_goal || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-500 text-xs">2 hours ago</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => startMeeting(client.id)}
                          className="p-2 bg-gray-700 hover:bg-blue-500 text-gray-400 hover:text-white rounded-xl transition-all" 
                          title="Start Video Call"
                        >
                          <FiVideo size={18} />
                        </button>
                        <button className="p-2 bg-gray-700 hover:bg-orange-500 text-gray-400 hover:text-white rounded-xl transition-all" title="Customize Plan">
                          <FiEdit3 size={18} />
                        </button>
                        <button className="p-2 bg-gray-700 hover:bg-blue-500 text-gray-400 hover:text-white rounded-xl transition-all" title="View Progress">
                          <FiActivity size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">No clients found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Session Calendar */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-3xl border border-gray-700 p-6">
            <h3 className="text-white text-xl font-black mb-4">Schedule Video Call</h3>
            <form onSubmit={scheduleSession} className="space-y-3">
              <select
                value={scheduleForm.client_id}
                onChange={(e) => setScheduleForm({ ...scheduleForm, client_id: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} (@{c.username})</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={scheduleForm.scheduled_at}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white"
              />
              <select
                value={scheduleForm.duration_minutes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: Number(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
              <button type="submit" className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black">
                Schedule Session
              </button>
            </form>
          </div>

          <div className="bg-gray-800/50 rounded-3xl border border-gray-700 p-6">
            <h3 className="text-white text-xl font-black mb-4">Upcoming Sessions</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.length === 0 && <p className="text-gray-500 text-sm">No sessions scheduled yet.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-gray-900 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white font-bold">{s.client_name || 'Client Session'}</p>
                    <span className="text-xs text-orange-300 uppercase font-bold">{s.status}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{new Date(s.scheduled_at).toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">{s.duration_minutes} minutes</p>
                  {s.status === 'pending_approval' && (
                    <p className="text-gray-500 text-xs mt-1">Requested by {s.requested_by_name || 'client'}</p>
                  )}
                  {s.meeting_link && (
                    <a href={s.meeting_link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-blue-400 text-sm hover:text-blue-300">
                      Join Meeting
                    </a>
                  )}
                  {s.status === 'pending_approval' && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => respondToSession(s.id, 'accept')} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-black uppercase tracking-widest hover:bg-green-500">
                        Accept
                      </button>
                      <button onClick={() => respondToSession(s.id, 'decline')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-500">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoachDashboard
