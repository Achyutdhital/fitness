import React, { useEffect, useState } from 'react'
import api, { coreAPI } from '../services/api'
import { FiUsers, FiCalendar, FiEdit3, FiActivity, FiSearch, FiVideo } from 'react-icons/fi'

const CoachDashboard = () => {
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
      </div>
    </div>
  )
}

export default CoachDashboard
