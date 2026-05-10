import React, { useEffect, useState } from 'react'
import { subscriptionAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { FiCheck, FiZap, FiStar, FiClock, FiVideo, FiLock } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const SubscriptionsPage = () => {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const { isAuthenticated, user, subscription } = useAuth()

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      const response = await subscriptionAPI.getTiers()
      setTiers(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierBadge = (name) => {
    switch (name.toLowerCase()) {
      case 'free': return { label: 'Try it free', color: 'bg-blue-500/20 text-blue-300' }
      case 'basic': return { label: 'No friction', color: 'bg-green-500/20 text-green-300' }
      case 'pro': return { label: 'Personalized', color: 'bg-purple-500/20 text-purple-300' }
      case 'elite': return { label: 'Full service', color: 'bg-orange-500/20 text-orange-300' }
      default: return null
    }
  }

  const getTierIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'free': return <FiClock className="text-blue-400" />
      case 'pro': return <FiStar className="text-purple-400" />
      case 'elite': return <FiZap className="text-orange-400" />
      default: return <FiCheck className="text-green-400" />
    }
  }

  const getYearlySavings = (tier) => {
    const monthly = tier.plans.find(p => p.billing_cycle === 'monthly')
    const yearly = tier.plans.find(p => p.billing_cycle === 'yearly')
    if (!monthly || !yearly) return null
    const wouldPay = parseFloat(monthly.price) * 12
    const saving = (wouldPay - parseFloat(yearly.price)).toFixed(0)
    return saving > 0 ? saving : null
  }


  const isActiveSubscription = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-2 mb-6">
            <FiZap className="text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">New: Flexible Billing for All Tiers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Choose Your <span className="gradient-text">Transformation</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Select the perfect level of support. From ad-supported free access to elite 1-on-1 coaching.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-800 rounded-2xl border border-gray-700">
            {['monthly', 'quarterly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  billingCycle === cycle
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const plan = tier.plans.find(p => p.billing_cycle === billingCycle)
            const isFree = tier.name.toLowerCase() === 'free'
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  tier.name.toLowerCase() === 'pro'
                    ? 'bg-gray-800 border-2 border-orange-500 shadow-2xl shadow-orange-500/10'
                    : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-gray-600'
                }`}
              >
                {tier.name.toLowerCase() === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-0.5 rounded-full text-xs font-black">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center">
                    {getTierIcon(tier.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white capitalize">{tier.name}</h3>
                    {(() => { const b = getTierBadge(tier.name); return b ? <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${b.color}`}>{b.label}</span> : null })()}
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-6 h-10 line-clamp-2">
                  {tier.description}
                </p>

                <div className="mb-6">
                  {isFree ? (
                    <div className="flex flex-col">
                      <span className="text-3xl font-black text-white">Free</span>
                      <span className="text-blue-400 text-xs font-bold mt-1 flex items-center gap-1">
                        <FiVideo size={12} /> Ad-supported unlock system
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-white">
                          ${plan ? plan.price : '—'}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">
                          /{billingCycle === 'monthly' ? 'mo' : billingCycle === 'quarterly' ? '3mo' : 'yr'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (() => { const s = getYearlySavings(tier); return s ? <span className="text-green-400 text-xs font-black mt-1 block">Save ${s}/yr vs monthly</span> : null })()}
                      {billingCycle === 'quarterly' && <span className="text-gray-500 text-xs mt-1 block">Billed every 3 months</span>}
                    </div>
                  )}
                </div>

                <Link
                  to={isFree ? '/dashboard' : (isAuthenticated ? '/payment' : '/register')}
                  state={!isFree && plan ? { plan } : undefined}
                  className={`w-full py-3 rounded-2xl font-black text-sm text-center block transition-all ${
                    isFree 
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : tier.name.toLowerCase() === 'pro'
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {isFree ? 'Get Started' : 'Subscribe Now'}
                </Link>

                <div className="mt-8 pt-6 border-t border-gray-700/50">
                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-4">What's Included</p>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature, i) => {
                      const isNo = feature.startsWith('❌')
                      const text = feature.replace(/^[✅❌]\s*/, '')
                      return (
                        <li key={i} className={`flex items-start space-x-2.5 ${isNo ? 'opacity-50' : ''}`}>
                          {isNo
                            ? <span className="text-red-400 mt-0.5 flex-shrink-0 text-xs">✗</span>
                            : <FiCheck className="text-orange-500 mt-0.5 flex-shrink-0" size={13} />
                          }
                          <span className={`text-xs leading-relaxed ${isNo ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                            {text}
                          </span>
                        </li>
                      )
                    })}
                    {tier.sessions_per_week > 0 && (
                      <li className="flex items-start space-x-2.5">
                        <FiStar className="text-purple-400 mt-0.5 flex-shrink-0" size={13} />
                        <span className="text-gray-300 text-xs font-bold leading-relaxed">
                          {tier.sessions_per_week} Coaching Session{tier.sessions_per_week > 1 ? 's' : ''}/Week
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

              </div>
            )
          })}
        </div>

        {/* Free Tier Callout */}
        <div className="mt-20 max-w-4xl mx-auto bg-blue-600/10 border border-blue-500/30 rounded-[2.5rem] p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-3">How the <span className="text-blue-400">Free Tier</span> Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Your dashboard and progress tracking are always free — your data belongs to you. 
              Watch ads to earn points and unlock extra Basic plans temporarily. Try the real product before committing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: <FiVideo />, label: 'Watch an Ad', desc: 'Complete a 15-second ad', reward: '+25 pts', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: <FiZap />, label: 'Collect Points', desc: 'Stack 50 pts per ad watch', reward: '25 → 50+', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              { icon: <FiCheck />, label: 'Preview a Session', desc: 'Single session from any plan', reward: '50 pts / 1 session', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            ].map((step, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${step.color} text-center`}>
                <div className="text-2xl mb-3 flex justify-center">{step.icon}</div>
                <h4 className="text-white font-black mb-1">{step.label}</h4>
                <p className="text-gray-500 text-xs mb-3">{step.desc}</p>
                <span className="font-black text-sm">{step.reward}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl text-center">
            <p className="text-gray-400 text-sm">
              <span className="text-orange-400 font-black">Note:</span> Points preview a single session only. Full multi-week programs, progressions & alternatives are available with a <span className="text-white font-bold">Basic subscription</span> — the real value.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link to="/register" className="btn bg-blue-500 text-white hover:bg-blue-600 px-10 py-4 rounded-3xl font-black text-base block text-center">
              Join Free — No Card Needed
            </Link>
            <span className="text-gray-600 font-bold text-sm">or</span>
            <Link to="/register" className="text-gray-400 hover:text-white font-bold text-sm underline underline-offset-4">
              Go straight to Basic →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SubscriptionsPage
