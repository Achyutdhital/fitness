import React, { useState, useRef, useEffect } from 'react'
import { aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  FiMessageCircle, FiX, FiSend, FiZap, FiLock,
  FiChevronDown, FiCpu
} from 'react-icons/fi'

const TIER_CONFIG = {
  free: {
    label: 'AI Coach',
    locked: true,
    color: 'text-gray-400',
    badge: null,
  },
  basic: {
    label: 'AI Coach',
    locked: false,
    color: 'text-blue-400',
    badge: 'General Tips',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    placeholder: 'Ask about workouts, nutrition, tips...',
    starters: [
      'How many rest days per week?',
      'What should I eat before a workout?',
      'How do I improve my push-up form?',
    ],
  },
  pro: {
    label: 'AI Coach Pro',
    locked: false,
    color: 'text-purple-400',
    badge: 'Personalised',
    badgeColor: 'bg-purple-500/20 text-purple-300',
    placeholder: 'Ask about your plan, goals, adjustments...',
    starters: [
      'How should I adjust my plan if I\'m sore?',
      'Is my nutrition on track for muscle gain?',
      'How do I break through a plateau?',
    ],
  },
  elite: {
    label: 'Elite AI Coach',
    locked: false,
    color: 'text-orange-400',
    badge: 'Full Coaching',
    badgeColor: 'bg-orange-500/20 text-orange-300',
    placeholder: 'Ask anything — form, periodisation, recovery...',
    starters: [
      'Review my last week and suggest adjustments',
      'Design my recovery protocol for this week',
      'What should my nutrition timing look like today?',
    ],
  },
}

const AICoach = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const { user, subscription } = useAuth()
  const tier = subscription?.tier_details?.name?.toLowerCase() || 'free'
  const config = TIER_CONFIG[tier] || TIER_CONFIG.free

  // Load persistent history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await aiAPI.getHistory()
        if (res.data && res.data.length > 0) {
          setMessages(res.data)
        }
      } catch (err) {
        console.error("Failed to load chat history", err)
      }
    }
    if (user && !config.locked) {
      loadHistory()
    }
  }, [user, config.locked])

  useEffect(() => {
    if (open && !config.locked && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: tier === 'basic'
          ? "Hi! I'm your FitCoachAI assistant. I can give you general fitness tips, nutrition basics, and workout guidance. What would you like to know?"
          : tier === 'pro'
          ? "Hey! I'm your personalised Pro AI Coach. I know your program and goals — ask me anything about adjustments, nutrition, or your progress."
          : "Welcome! I'm your dedicated Elite AI Coach. I have full context on your training, body data, and history. Ask me anything — no question is too specific.",
      }])
    }
  }, [open, tier, config.locked])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open && !config.locked) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, config.locked])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    
    // Optimistically add user message
    const userMsg = { role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    
    try {
      // Backend now handles history from the database
      const res = await aiAPI.chat(msg)
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch (err) {
      const errMsg = err.response?.data?.reply || err.response?.data?.message || 'Something went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg, isError: true }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
          open
            ? 'bg-gray-800 border border-gray-600 rotate-0'
            : config.locked
            ? 'bg-gray-800 border border-gray-700 hover:border-gray-500'
            : tier === 'elite'
            ? 'bg-gradient-to-br from-orange-500 to-pink-600 shadow-orange-500/30'
            : tier === 'pro'
            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/30'
            : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30'
        }`}
        title={config.locked ? 'AI Coach — Upgrade to unlock' : config.label}
      >
        {open
          ? <FiX className="text-white" size={22} />
          : config.locked
          ? <FiLock className="text-gray-400" size={20} />
          : <FiCpu className="text-white" size={22} />
        }
        {!config.locked && !open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[89] w-full max-w-sm bg-gray-900 border border-gray-700 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-800 ${
            tier === 'elite' ? 'bg-gradient-to-r from-orange-600/20 to-pink-600/10' :
            tier === 'pro' ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10' :
            'bg-gray-800/50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                config.locked ? 'bg-gray-700' :
                tier === 'elite' ? 'bg-orange-500/20' :
                tier === 'pro' ? 'bg-purple-500/20' : 'bg-blue-500/20'
              }`}>
                <FiCpu className={config.color} size={18} />
              </div>
              <div>
                <p className="text-white font-black text-sm">{config.label}</p>
                {config.badge && (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                    {config.badge}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <FiChevronDown size={20} />
            </button>
          </div>

          {/* Locked State */}
          {config.locked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-[1.5rem] flex items-center justify-center mb-5">
                <FiLock className="text-gray-500" size={28} />
              </div>
              <h3 className="text-white font-black text-lg mb-2">AI Coach Locked</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Get general fitness tips with <strong className="text-white">Basic</strong>, personalised coaching with <strong className="text-white">Pro</strong>, and full coaching with <strong className="text-white">Elite</strong>.
              </p>
              <Link
                to="/subscriptions"
                onClick={() => setOpen(false)}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm text-center block transition-all"
              >
                View Plans
              </Link>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mr-2 mt-1 ${
                        tier === 'elite' ? 'bg-orange-500/20' :
                        tier === 'pro' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                      }`}>
                        <FiCpu className={config.color} size={13} />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white rounded-br-sm'
                        : msg.isError
                        ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
                        : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mr-2 mt-1 ${
                      tier === 'elite' ? 'bg-orange-500/20' : tier === 'pro' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                    }`}>
                      <FiCpu className={config.color} size={13} />
                    </div>
                    <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Starter Questions */}
              {messages.length <= 1 && config.starters && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {config.starters.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="text-[11px] px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl border border-gray-700 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-800 flex items-end space-x-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={config.placeholder}
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-gray-800 text-white text-sm px-4 py-3 rounded-2xl border border-gray-700 focus:border-orange-500/50 focus:outline-none resize-none placeholder-gray-600 disabled:opacity-50 max-h-24"
                  style={{ overflowY: 'auto' }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                    input.trim() && !loading
                      ? tier === 'elite' ? 'bg-orange-500 hover:bg-orange-600' :
                        tier === 'pro' ? 'bg-purple-500 hover:bg-purple-600' :
                        'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-800 opacity-40'
                  }`}
                >
                  <FiSend className="text-white" size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default AICoach
