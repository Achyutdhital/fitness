import React, { useEffect, useState } from 'react'
import { subscriptionAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { FiCheck, FiZap, FiStar, FiClock, FiVideo, FiArrowRight } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import PlanCard from '../components/PlanCard'

const SubscriptionsPage = () => {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [customSessionsPerWeek, setCustomSessionsPerWeek] = useState(4)
  const [customSessionMinutes, setCustomSessionMinutes] = useState(30)
  const { isAuthenticated, user, subscription } = useAuth()
  const billingCycleWeeks = {
    monthly: 4,
    quarterly: 13,
    yearly: 52,
  }
  const billingCycleLabels = {
    monthly: 'Monthly total',
    quarterly: 'Quarterly total',
    yearly: 'Yearly total',
  }
  const billingCycleDiscounts = {
    monthly: 1,
    quarterly: 0.95,
    yearly: 0.9,
  }

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      const response = await subscriptionAPI.getTiers()
      const data = response.data.results || response.data || []
      const normalized = Array.isArray(data)
        ? data.map((tier) => ({
            ...tier,
            plans: tier.plans || tier.packages || [],
          }))
        : []
      setTiers(normalized)
    } catch (error) {
      console.error('Failed to load tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  const currentTierName = subscription?.is_custom ? 'custom' : (subscription?.tier_details?.name?.toLowerCase() || 'free')
  const visibleTiers = tiers.filter(tier => (tier.name || '').toLowerCase() !== 'custom')
  const currentTierIndex = visibleTiers.findIndex(t => t.name.toLowerCase() === currentTierName)
  const getTierRank = (name) => ({ free: 0, basic: 1, pro: 2, elite: 3, custom: 4 }[name?.toLowerCase()] ?? -1)
  const currentTierRank = getTierRank(currentTierName)
  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription?.end_date || new Date(subscription.end_date) > new Date())
  const showOnlyUpgrades = Boolean(subscription && isSubscriptionActive && currentTierRank >= 0)
  const filteredVisibleTiers = showOnlyUpgrades ? visibleTiers.filter(t => getTierRank(t.name) > currentTierRank) : visibleTiers
  const eliteTier = tiers.find(tier => tier.name.toLowerCase() === 'elite')
  const eliteBillingPlan = eliteTier?.plans?.find(plan => plan.billing_cycle === billingCycle)
  const eliteTierName = eliteTier?.name || 'Elite'
  const eliteBasePrice = Number(eliteBillingPlan?.price || 0)
  const eliteHourlyRate = Number(eliteTier?.custom_hourly_rate || 0)
  const customWeeklyHours = (Number(customSessionsPerWeek) * Number(customSessionMinutes)) / 60
  const customWeeklyAddon = customWeeklyHours * eliteHourlyRate
  const customCycleWeeks = billingCycleWeeks[billingCycle] || 4
  const customCycleDiscount = billingCycleDiscounts[billingCycle] || 1
  const customCycleAddon = customWeeklyAddon * customCycleWeeks * customCycleDiscount
  const customCycleTotal = eliteBasePrice + customCycleAddon
  const customCoachPlan = {
    id: 'custom-coach',
    name: 'Custom Coach',
    billing_cycle: billingCycle,
    duration_days: eliteBillingPlan?.duration_days || 30,
    price: customCycleTotal.toFixed(2),
    is_custom: true,
    custom_config: {
      name: 'Custom Coach',
      billing_cycle: billingCycle,
      base_plan_id: eliteBillingPlan?.id,
      base_plan_name: eliteBillingPlan ? `${eliteTierName} ${billingCycle}` : `Elite ${billingCycle}`,
      base_price: eliteBasePrice.toFixed(2),
      hourly_rate: eliteHourlyRate.toFixed(2),
      sessions_per_week: Number(customSessionsPerWeek),
      session_duration_minutes: Number(customSessionMinutes),
      weekly_addon: customWeeklyAddon.toFixed(2),
      billing_cycle_addon: customCycleAddon.toFixed(2),
      monthly_addon: customCycleAddon.toFixed(2),
      total_price: customCycleTotal.toFixed(2),
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
        <div className="max-w-7xl mx-auto">
          {showOnlyUpgrades && (
            <div className="mb-6">
              <h4 className="text-sm text-slate-400 font-black mb-3">Your current plan</h4>
              {tiers.find(t => t.name.toLowerCase() === currentTierName) ? (
                (() => {
                  const cur = tiers.find(t => t.name.toLowerCase() === currentTierName)
                  const curPlan = (cur?.plans || []).find(p => p.billing_cycle === billingCycle)
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <PlanCard
                        tier={cur}
                        plan={curPlan}
                        billingCycle={billingCycle}
                        idx={currentTierIndex}
                        currentTierName={currentTierName}
                        currentTierIndex={currentTierIndex}
                        isAuthenticated={isAuthenticated}
                        userIsCustom={Boolean(subscription?.is_custom)}
                      />
                    </motion.div>
                  )
                })()
              ) : (
                <div className="text-slate-400">No active plan found.</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVisibleTiers.map((tier, idx) => {
              const plan = (tier.plans || []).find(p => p.billing_cycle === billingCycle)
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <PlanCard
                    tier={tier}
                    plan={plan}
                    billingCycle={billingCycle}
                    idx={idx}
                    currentTierName={currentTierName}
                    currentTierIndex={currentTierIndex}
                    isAuthenticated={isAuthenticated}
                      userIsCustom={Boolean(subscription?.is_custom)}
                  />
                </motion.div>
              )
            })}
          </div>
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
                Your custom package starts with the Elite plan for the selected billing cycle and adds live coaching time based on sessions per week, session length, and the admin-set hourly rate.
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
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Price Breakdown</p>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span>{eliteBillingPlan ? `${eliteTierName} ${billingCycle}` : 'Elite base plan'}</span>
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
                  <span>{billingCycleLabels[billingCycle] || 'Total'}</span>
                  <span className="font-black text-white">${customCycleAddon.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">{billingCycleLabels[billingCycle] || 'Total'}</p>
                  <p className="text-4xl font-black text-white">${customCycleTotal.toFixed(2)}</p>
                </div>
                <Link
                  to="/payment"
                  state={{ pkg: customCoachPlan }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02]"
                >
                  Continue to Custom Checkout
                  <FiArrowRight />
                </Link>
              </div>

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
