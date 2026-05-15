import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { coreAPI } from '../services/api'
import { FiCalendar, FiVideo, FiMessageCircle, FiClock, FiCheck, FiX, FiInfo } from 'react-icons/fi'
import { motion } from 'framer-motion'

const CoachingPage = () => {
  const { user, subscription } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingError, setBookingError] = useState('')

  // Determine user tier limits
  const tier = subscription?.tier_details?.name?.toLowerCase() || 'free'
  const isPro = tier === 'pro'
  const isElite = tier === 'elite'
  const limit = subscription?.tier_details?.video_sessions_per_month ?? (isElite ? 2 : 0)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await coreAPI.getSessions()
      const data = response.data.results || response.data || []
      setSessions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load sessions', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (e) => {
    e.preventDefault()
    setBookingError('')
    if (!bookingDate || !bookingTime) {
      setBookingError('Please select date and time.')
      return
    }

    try {
      const scheduled_at = new Date(`${bookingDate}T${bookingTime}`).toISOString()
      await coreAPI.createSession({ scheduled_at })
      setBookingDate('')
      setBookingTime('')
      fetchSessions()
      alert('Session request sent. Waiting for coach confirmation.')
    } catch (err) {
      const errMessage = err.response?.data?.error || 'Failed to book session.'
      setBookingError(errMessage)
    }
  }

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      try {
        await coreAPI.cancelSession(id)
        fetchSessions()
      } catch (err) {
        console.error('Failed to cancel', err)
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] py-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">1-on-1 Coaching</h1>
          <p className="text-slate-400">Book your weekly video sessions and get real-time feedback.</p>
        </div>

        {tier === 'free' || tier === 'pro' ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center max-w-2xl mx-auto mt-20 backdrop-blur-xl">
            <FiVideo className="text-slate-600 mx-auto mb-6" size={64} />
            <h2 className="text-2xl font-black text-white mb-4">Elite & Custom Exclusive</h2>
            <p className="text-slate-400 mb-8">
              1-on-1 video coaching sessions are reserved for Elite and Custom Packages.
              Upgrade your pkg to unlock direct access to our fitness experts.
            </p>
            <a href="/subscriptions" className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all inline-block">
              Upgrade Package
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <FiCalendar size={100} className="text-orange-500" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-6 relative z-10">Book a Session</h3>
                
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 relative z-10 flex items-start gap-3">
                  <FiInfo className="text-orange-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300 font-medium">Your current limit:</p>
                    <p className="text-orange-400 font-black">{limit} sessions / month</p>
                  </div>
                </div>

                <form onSubmit={handleBook} className="space-y-4 relative z-10">
                  {bookingError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm font-medium">
                      {bookingError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Select Date</label>
                    <input 
                      type="date" 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Select Time</label>
                    <input 
                      type="time" 
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>

                    <button type="submit" className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                    <FiCheck /> Book Now
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">Chat Support</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Need quick advice outside of your video session? Use the AI Coach widget on the bottom right for immediate answers, or send a message to your coach below.
                </p>
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  <FiMessageCircle /> Open Messages
                </button>
              </div>
            </div>

            {/* Upcoming Sessions Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-xl font-black text-white mb-6">Upcoming Sessions</h3>
                
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mx-auto mb-4">
                      <FiCalendar size={24} />
                    </div>
                    <h4 className="text-white font-bold mb-1">No upcoming sessions</h4>
                    <p className="text-slate-500 text-sm">You have no coaching sessions scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session, idx) => {
                      const date = new Date(session.scheduled_at)
                      const isCancelled = session.status === 'canceled'
                      const isCompleted = session.status === 'completed'
                      const isPending = session.status === 'pending_approval'
                      
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={session.id} 
                          className={`border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                            isCancelled 
                              ? 'bg-slate-800/30 border-slate-800 opacity-60' 
                              : isCompleted
                                ? 'bg-green-500/5 border-green-500/20'
                                : isPending
                                  ? 'bg-blue-500/5 border-blue-500/20'
                                  : 'bg-slate-800 border-slate-700 hover:border-orange-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                              isCancelled ? 'bg-slate-700/50 text-slate-500' : 'bg-orange-500/10 text-orange-400'
                            }`}>
                              <span className="text-xs font-black uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-xl font-black">{date.getDate()}</span>
                            </div>
                            
                            <div>
                              <h4 className={`font-bold ${isCancelled ? 'text-slate-500 line-through' : 'text-white'}`}>
                                1-on-1 Coaching
                              </h4>
                              <div className="flex items-center gap-3 text-sm mt-1">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <FiClock size={12} />
                                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`text-xs font-black uppercase tracking-widest ${
                                  session.status === 'pending_approval' ? 'text-amber-400' :
                                  session.status === 'scheduled' ? 'text-blue-400' : 
                                  session.status === 'completed' ? 'text-green-400' : 'text-slate-500'
                                }`}>
                                  {session.status}
                                </span>
                              </div>
                              {isPending && (
                                <p className="mt-2 text-xs text-slate-400">
                                  {session.requested_by_name ? `Requested by ${session.requested_by_name}` : 'Waiting for confirmation'}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto">
                            {!isCancelled && !isCompleted && session.status === 'scheduled' && (
                              <>
                                <a 
                                  href={session.meeting_link} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex-1 md:flex-none px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                  <FiVideo /> Join
                                </a>
                                <button 
                                  onClick={() => handleCancel(session.id)}
                                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                  title="Cancel Session"
                                >
                                  <FiX />
                                </button>
                              </>
                            )}
                            {isPending && (
                              <button 
                                onClick={() => handleCancel(session.id)}
                                className="px-4 py-2.5 bg-slate-700 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-all"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoachingPage
