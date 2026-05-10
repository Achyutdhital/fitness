import React, { useEffect, useState } from 'react'
import { coreAPI } from '../../services/api'
import { FiUsers, FiActivity, FiSearch, FiExternalLink, FiChevronRight, FiClock, FiTarget } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import SEO from '../../components/SEO'

const AdminClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const res = await coreAPI.getCoachClients()
      setClients(res.data)
    } catch (e) {
      console.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase()) || 
    (c.first_name + ' ' + c.last_name).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-8">
      <SEO title="My Clients" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">My <span className="gradient-text">Clients</span></h1>
          <p className="text-gray-500 text-sm font-medium">Manage and monitor your assigned fitness members.</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-orange-500/50 outline-none transition-all font-medium text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800/40 rounded-[2rem] p-8 border border-gray-800 animate-pulse h-64" />
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="group bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-8 border border-gray-700 hover:border-orange-500/30 transition-all flex flex-col shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-orange-500/20">
                    {(client.first_name?.[0] || client.username?.[0]).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg leading-tight">{client.first_name} {client.last_name}</h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">@{client.username}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  client.subscription?.tier?.name?.toLowerCase() === 'elite' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  client.subscription?.tier?.name?.toLowerCase() === 'pro' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  'bg-gray-700/50 text-gray-400 border-gray-600'
                }`}>
                  {client.subscription?.tier?.name || 'No Tier'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-900/50 rounded-2xl p-3 border border-gray-700/50">
                   <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center space-x-1">
                     <FiClock size={10} className="text-orange-400" />
                     <span>Last Active</span>
                   </p>
                   <p className="text-white font-bold text-xs">2 hours ago</p>
                </div>
                <div className="bg-gray-900/50 rounded-2xl p-3 border border-gray-700/50">
                   <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center space-x-1">
                     <FiActivity size={10} className="text-green-400" />
                     <span>Streak</span>
                   </p>
                   <p className="text-white font-bold text-xs">7 Days</p>
                </div>
              </div>

              <div className="mt-auto flex items-center space-x-3">
                <Link 
                  to={`/admin/clients/${client.id}`}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center transition-all"
                >
                  View Details
                </Link>
                <button className="w-12 h-12 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-orange-500/20">
                  <FiExternalLink size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-800/20 rounded-[3rem] border border-gray-700/50">
          <FiUsers className="text-gray-700 mx-auto mb-6" size={64} />
          <h3 className="text-white font-black text-2xl mb-2">No Clients Found</h3>
          <p className="text-gray-500 text-sm">You don't have any assigned clients matching this search.</p>
        </div>
      )}
    </div>
  )
}

export default AdminClients
