import React, { useEffect, useState } from 'react'
import { subscriptionAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { FiCheck, FiZap, FiStar, FiClock, FiVideo, FiArrowRight } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

const SubscriptionsPage = () => {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [customSessionsPerWeek, setCustomSessionsPerWeek] = useState(4)
  const [customSessionMinutes, setCustomSessionMinutes] = useState(30)
  const [customHourlyRate, setCustomHourlyRate] = useState(40)
  const { isAuthenticated, user, subscription } = useAuth()

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      const response = await subscriptionAPI.getTiers()
      const data = response.data.results || response.data || []
      setTiers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'free': return <FiClock size={24} className="text-blue-400" />
      case 'pro': return <FiStar size={24} className="text-purple-400" />
      case 'elite': return <FiZap size={24} className="text-orange-400" />
      default: return <FiCheck size={24} className="text-green-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  const currentTierName = subscription?.tier_details?.name?.toLowerCase() || 'free'
  const visibleTiers = tiers.filter(tier => tier.name.toLowerCase() !== 'custom')
  const currentTierIndex = visibleTiers.findIndex(t => t.name.toLowerCase() === currentTierName)
  const eliteTier = tiers.find(tier => tier.name.toLowerCase() === 'elite')
  const eliteMonthlyPlan = eliteTier?.plans?.find(plan => plan.billing_cycle === 'monthly')
  const eliteBasePrice = Number(eliteMonthlyPlan?.price || 0)
  const customWeeklyHours = (Number(customSessionsPerWeek) * Number(customSessionMinutes)) / 60
  const customWeeklyAddon = customWeeklyHours * Number(customHourlyRate)
  const customMonthlyAddon = customWeeklyAddon * 4
  const customMonthlyTotal = eliteBasePrice + customMonthlyAddon
  const customCoachPlan = {
    id: 'custom-coach',
    name: 'Custom Coach',
    billing_cycle: 'monthly',
    duration_days: 30,
    price: customMonthlyTotal.toFixed(2),
    is_custom: true,
    custom_config: {
      name: 'Custom Coach',
      base_plan_id: eliteMonthlyPlan?.id,
      base_plan_name: eliteMonthlyPlan ? `${eliteTier.name} Monthly` : 'Elite Monthly',
      base_price: eliteBasePrice.toFixed(2),
      sessions_per_week: Number(customSessionsPerWeek),
      session_duration_minutes: Number(customSessionMinutes),
      hourly_rate: Number(customHourlyRate),
      weekly_addon: customWeeklyAddon.toFixed(2),
      monthly_addon: customMonthlyAddon.toFixed(2),
      total_price: customMonthlyTotal.toFixed(2),
    },
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6"
          >
            <FiZap className="text-orange-400" />
            <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Select Your Protocol</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
          >
            Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Access</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg max-w-2xl mx-auto mb-10 font-medium"
          >
            Choose the level of intensity your transformation requires.
          </motion.p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            {['monthly', 'quarterly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  billingCycle === cycle
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {visibleTiers.map((tier, idx) => {
            const plan = tier.plans.find(p => p.billing_cycle === billingCycle)
            const isFree = tier.name.toLowerCase() === 'free'
            const isPopular = tier.name.toLowerCase() === 'pro'
            const isCurrent = tier.name.toLowerCase() === currentTierName
            
            let buttonText = 'Subscribe'
            let buttonLink = isAuthenticated ? '/payment' : '/register'
            
            let isIncluded = false
            if (isAuthenticated) {
              if (isCurrent) {
                buttonText = 'Current Plan'
                buttonLink = '/dashboard'
              } else if (idx > currentTierIndex) {
                buttonText = 'Upgrade'
              } else if (idx < currentTierIndex) {
                buttonText = 'Included'
                isIncluded = true
                buttonLink = '/dashboard'
              }
            } else {
              if (isFree) {
                buttonText = 'Initialize'
              } else {
                buttonText = 'Subscribe'
              }
            }
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-[2.5rem] p-8 transition-all duration-500 group ${
                  isPopular
                    ? 'bg-slate-900 border-2 border-orange-500 shadow-2xl shadow-orange-500/10'
                    : 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-orange-500/30'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50 shadow-inner group-hover:bg-orange-500/10 transition-colors duration-500">
                    {getTierIcon(tier.name)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">{tier.name}</h3>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier {idx + 1}</span>
                  </div>
                </div>

                <div className="mb-10">
                  {isFree ? (
                    <div className="flex flex-col">
                      <span className="text-5xl font-black text-white">FREE</span>
                      <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                        <FiVideo size={14} /> AD-SUPPORTED
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">
                          ${plan ? plan.price : '—'}
                        </span>
                        <span className="text-slate-500 text-xs font-black uppercase tracking-widest">
                          /{billingCycle === 'monthly' ? 'mo' : billingCycle === 'quarterly' ? '3mo' : 'yr'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Billed {billingCycle}</p>
                    </div>
                  )}
                </div>

                {isCurrent || isIncluded ? (
                  <div className="w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-center block transition-all bg-green-500/20 text-green-400 border border-green-500/30">
                    {buttonText}
                  </div>
                ) : (
                  <Link
                    to={buttonLink}
                    state={!isFree && plan ? { plan } : undefined}
                    className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-center block transition-all ${
                      isFree 
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : isPopular
                          ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02]'
                          : 'bg-white text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {buttonText}
                  </Link>
                )}

                <div className="mt-10 pt-8 border-t border-slate-800/50">
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-6">Inclusions</p>
                  <ul className="space-y-4">
                    {tier.features.map((feature, i) => {
                      const isNo = feature.startsWith('❌')
                      const text = feature.replace(/^[✅❌]\s*/, '')
                      return (
                        <li key={i} className={`flex items-start space-x-3 ${isNo ? 'opacity-30' : ''}`}>
                          {isNo
                            ? <span className="text-red-500 mt-1 flex-shrink-0 text-xs">✗</span>
                            : <FiCheck className="text-orange-500 mt-1 flex-shrink-0" size={14} />
                          }
                          <span className={`text-xs font-bold leading-relaxed ${isNo ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                            {text}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-7xl mx-auto rounded-[3rem] border border-slate-800/70 bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10 pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-4">
                <FiZap className="text-orange-400" />
                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Custom Coach Calculator</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Build a custom 1-on-1 coaching package</h3>
              <p className="text-slate-400 max-w-2xl mb-6">
                Your custom package starts with the Elite monthly base and adds live coaching time based on sessions per week, session length, and your hourly rate.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Sessions / week</span>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={customSessionsPerWeek}
                    onChange={(e) => setCustomSessionsPerWeek(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-orange-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Session length (min)</span>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={customSessionMinutes}
                    onChange={(e) => setCustomSessionMinutes(Math.max(15, Number(e.target.value) || 15))}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-orange-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Hourly rate</span>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={customHourlyRate}
                    onChange={(e) => setCustomHourlyRate(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-orange-500"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Price Breakdown</p>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Elite base monthly plan</span>
                  <span className="font-black text-white">${eliteBasePrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Live coaching per week</span>
                  <span className="font-black text-white">{customSessionsPerWeek} x {customSessionMinutes} min</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Weekly add-on</span>
                  <span className="font-black text-white">${customWeeklyAddon.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Monthly add-on</span>
                  <span className="font-black text-white">${customMonthlyAddon.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Estimated monthly total</p>
                  <p className="text-4xl font-black text-white">${customMonthlyTotal.toFixed(2)}</p>
                </div>
                <Link
                  to="/payment"
                  state={{ plan: customCoachPlan }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02]"
                >
                  Continue to Custom Checkout
                  <FiArrowRight />
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Example: 4 sessions x 30 minutes at $40/hour adds $80 per week, or $320 per month, on top of the Elite base.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Free Tier Deep Dive */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 max-w-5xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-[3rem] p-10 md:p-16 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full" />
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">The <span className="text-orange-500">Free Tier</span> Infrastructure</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
              We believe elite data should be accessible. Your tracking remains free forever. 
              Earn access to expert sessions through our ad-reward system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 relative z-10">
            {[
              { icon: <FiVideo />, label: 'Neural Watch', desc: 'Watch a 15s briefing', reward: '+25 XP' },
              { icon: <FiZap />, label: 'Accumulate', desc: 'Stack points in your vault', reward: 'XP Based' },
              { icon: <FiArrowRight />, label: 'Deploy', desc: 'Unlock a single session', reward: '50 XP / Session' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-orange-500 mb-6 border border-slate-700 transition-all group-hover:scale-110 group-hover:border-orange-500/50 shadow-xl">
                   {step.icon}
                </div>
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{step.label}</h4>
                <p className="text-slate-500 text-xs font-bold mb-4">{step.desc}</p>
                <span className="text-orange-500 font-black text-[10px] uppercase tracking-[0.2em]">{step.reward}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 relative z-10">
            <Link to="/register" className="px-10 py-5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all">
              Initialize Free Protocol
            </Link>
            <Link to="/register" className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all">
              Direct to Basic →
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

export default SubscriptionsPage
