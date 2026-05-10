import React, { useState } from 'react'
import { FiCalendar, FiClock, FiChevronLeft, FiChevronRight, FiPlus, FiUser, FiMoreVertical } from 'react-icons/fi'
import SEO from '../../components/SEO'

const AdminSchedule = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay()
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  const month = currentMonth.getMonth()
  const year = currentMonth.getFullYear()
  
  const sessions = [
    { day: 12, time: '09:00 AM', client: 'Achyut Dhital', type: 'Personal Training', tier: 'Elite' },
    { day: 12, time: '02:00 PM', client: 'John Doe', type: 'Nutrition Consult', tier: 'Pro' },
    { day: 14, time: '10:30 AM', client: 'Sarah Connor', type: 'HIIT Session', tier: 'Elite' },
    { day: 15, time: '04:00 PM', client: 'Mike Tyson', type: 'Boxing', tier: 'Elite' },
  ]

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const renderDays = () => {
    const totalDays = daysInMonth(month, year)
    const firstDay = firstDayOfMonth(month, year)
    const days = []
    
    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-800/50 bg-gray-900/20" />)
    }
    
    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const daySessions = sessions.filter(s => s.day === d)
      const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
      
      days.push(
        <div key={d} className={`h-32 border border-gray-800/50 p-2 transition-all hover:bg-gray-800/30 group relative ${isToday ? 'bg-orange-500/5' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-black ${isToday ? 'bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-500 group-hover:text-white'}`}>
              {d}
            </span>
            {daySessions.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
          </div>
          
          <div className="space-y-1 overflow-y-auto h-20 scrollbar-hide">
            {daySessions.map((s, i) => (
              <div key={i} className={`text-[9px] p-1 rounded font-bold truncate ${s.tier === 'Elite' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {s.time} - {s.client.split(' ')[0]}
              </div>
            ))}
          </div>
          
          <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 text-orange-400 hover:text-white transition-all">
            <FiPlus size={14} />
          </button>
        </div>
      )
    }
    
    return days
  }

  return (
    <div className="p-6 space-y-8">
      <SEO title="Training Schedule" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Training <span className="gradient-text">Schedule</span></h1>
          <p className="text-gray-500 text-sm font-medium">Coordinate your weekly sessions and client availability.</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2 px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20">
          <FiPlus />
          <span>New Session</span>
        </button>
      </div>

      <div className="bg-gray-800/40 backdrop-blur-md rounded-[2.5rem] border border-gray-700 overflow-hidden shadow-2xl">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-black text-white">{monthNames[month]} {year}</h2>
            <div className="flex items-center bg-gray-800 rounded-xl p-1">
              <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                <FiChevronLeft />
              </button>
              <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-800 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-all border border-gray-700">Month</button>
            <button className="px-4 py-2 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl hover:text-white transition-all">Week</button>
            <button className="px-4 py-2 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl hover:text-white transition-all">Day</button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 bg-gray-900/30 border-b border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {renderDays()}
        </div>
      </div>

      {/* Upcoming List (Mobile Optimized View) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-white font-black text-lg flex items-center space-x-3">
              <FiClock className="text-orange-400" />
              <span>Upcoming Today</span>
           </h3>
           <div className="space-y-3">
             {sessions.filter(s => s.day === 12).map((s, i) => (
               <div key={i} className="flex items-center justify-between p-5 bg-gray-800/40 rounded-3xl border border-gray-700 hover:border-orange-500/30 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black ${s.tier === 'Elite' ? 'bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`}>
                      {s.client[0]}
                    </div>
                    <div>
                       <p className="text-white font-black text-sm">{s.client}</p>
                       <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{s.type} · {s.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.tier === 'Elite' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {s.tier}
                    </span>
                    <button className="text-gray-500 hover:text-white transition-colors">
                      <FiMoreVertical />
                    </button>
                  </div>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-[2.5rem] p-8 border border-blue-500/20">
           <h3 className="text-white font-black text-lg mb-4 flex items-center space-x-3">
              <FiUser className="text-blue-400" />
              <span>Availability</span>
           </h3>
           <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
             Set your active hours so clients can book sessions within your preferred timeframes.
           </p>
           <div className="space-y-3">
              {['Monday - Friday', '09:00 AM - 06:00 PM'].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{i === 0 ? 'Days' : 'Hours'}</span>
                  <span className="text-white font-bold text-xs">{t}</span>
                </div>
              ))}
           </div>
           <button className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
             Edit Schedule
           </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSchedule
