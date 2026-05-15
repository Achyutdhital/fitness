import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheck, FiStar, FiPlay, FiUsers, FiAward, FiTrendingUp, FiHeart, FiZap, FiTarget, FiClock, FiVideo } from 'react-icons/fi'
import PlanCard from '../components/PlanCard'
import { useAuth } from '../context/AuthContext'
import { subscriptionAPI } from '../services/api'
import { motion } from 'framer-motion'

const stats = [
  { value: '10K+', label: 'Students Transformed', icon: FiUsers },
  { value: '500+', label: 'Expert Programs', icon: FiAward },
  { value: '98%', label: 'Success Rate', icon: FiTrendingUp },
  { value: '4.9★', label: 'Average Rating', icon: FiStar },
]

const features = [
  { icon: '🧠', title: 'Science-Based Programs', description: 'Every program is backed by sports science and nutrition research for maximum results', color: 'from-purple-500 to-indigo-500' },
  { icon: '🥗', title: 'Personalized Nutrition', description: 'Custom meal plans tailored to your body type, goals, and dietary preferences', color: 'from-green-500 to-teal-500' },
  { icon: '📊', title: 'Real-Time Progress', description: 'Track every metric — weight, strength, endurance, and body composition', color: 'from-orange-500 to-red-500' },
  { icon: '🎯', title: 'Goal-Oriented Coaching', description: 'Whether it\'s weight loss, muscle gain, or endurance — we have a path for you', color: 'from-pink-500 to-rose-500' },
  { icon: '🏃', title: 'Flexible Scheduling', description: 'Work out on your schedule — home, gym, or anywhere with 15-90 min sessions', color: 'from-cyan-500 to-blue-500' },
  { icon: '🤝', title: 'Community Support', description: 'Join thousands of members sharing progress, tips, and motivation daily', color: 'from-yellow-500 to-orange-500' },
]

const testimonials = [
  { name: 'Sarah M.', role: 'Lost 30 lbs in 4 months', text: 'I tried every gym and diet out there. This program finally gave me the structure and knowledge I needed. The nutrition coaching alone changed everything.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', rating: 5 },
  { name: 'James K.', role: 'Gained 15 lbs of muscle', text: 'As a busy professional, I needed something flexible. The 30-minute programs are intense and effective. I\'ve never been in better shape at 38.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', rating: 5 },
  { name: 'Priya R.', role: 'Marathon finisher', text: 'The endurance programs took me from couch to completing my first marathon. The progressive training plans are brilliant.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', rating: 5 },
]

// Removing static pricing array
const coaches = [
  { name: 'Alex Rivera', specialty: 'Strength & Conditioning', experience: '12 years', clients: '500+', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300' },
  { name: 'Maya Chen', specialty: 'Nutrition & Weight Loss', experience: '8 years', clients: '800+', img: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300' },
  { name: 'Marcus Johnson', specialty: 'HIIT & Endurance', experience: '10 years', clients: '600+', img: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300' },
]

const LandingPage = () => {
  const { isAuthenticated, user, subscription } = useAuth()
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [tiers, setTiers] = useState([])
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [customSessionsPerWeek, setCustomSessionsPerWeek] = useState(4)
  const [customSessionMinutes, setCustomSessionMinutes] = useState(30)

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 4000)
    loadTiers()
    return () => clearInterval(timer)
  }, [])

  const loadTiers = async () => {
    try {
      const response = await subscriptionAPI.getTiers()
      const data = response.data.results || response.data || []
      const normalized = Array.isArray(data)
        ? data.map((tier) => ({ ...tier, plans: tier.plans || tier.packages || [] }))
        : []
      setTiers(normalized)
    } catch (error) {
      console.error('Failed to load tiers:', error)
    }
  }

  const currentTierName = subscription?.is_custom ? 'custom' : (subscription?.tier_details?.name?.toLowerCase() || 'free')
  const visibleTiers = tiers.filter(tier => tier.name.toLowerCase() !== 'custom')
  const currentTierIndex = visibleTiers.findIndex(t => t.name.toLowerCase() === currentTierName)
  const getTierRank = (name) => ({ free: 0, basic: 1, pro: 2, elite: 3, custom: 4 }[name?.toLowerCase()] ?? -1)
  const currentTierRank = getTierRank(currentTierName)
  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription?.end_date || new Date(subscription.end_date) > new Date())
  const showOnlyUpgrades = Boolean(subscription && isSubscriptionActive && currentTierRank >= 0)
  const filteredVisibleTiers = showOnlyUpgrades ? visibleTiers.filter(t => getTierRank(t.name) > currentTierRank) : visibleTiers
  const activeCustomConfig = subscription?.is_custom ? subscription?.custom_config : null
  const eliteTier = tiers.find(tier => tier.name.toLowerCase() === 'elite')
  const eliteBillingPlan = eliteTier?.plans?.find(plan => plan.billing_cycle === billingCycle)
  const eliteBasePrice = Number(eliteBillingPlan?.price || 0)
  const eliteHourlyRate = Number(eliteTier?.custom_hourly_rate || 0)

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
  const customSessionsValue = Number(activeCustomConfig?.sessions_per_week || customSessionsPerWeek)
  const customMinutesValue = Number(activeCustomConfig?.session_duration_minutes || customSessionMinutes)
  const customWeeklyHours = (customSessionsValue * customMinutesValue) / 60
  const customWeeklyAddon = customWeeklyHours * eliteHourlyRate
  const customCycleWeeks = billingCycleWeeks[billingCycle] || 4

  const billingCycleDiscounts = {
    monthly: 1,
    quarterly: 0.9,
    yearly: 0.8,
  }
  const customCycleDiscount = billingCycleDiscounts[billingCycle] || 1
  const customCycleAddon = customWeeklyAddon * customCycleWeeks * customCycleDiscount
  const customCycleTotal = eliteBasePrice + customCycleAddon
  const eliteMonthlyPlan = eliteTier?.plans?.find(plan => plan.billing_cycle === 'monthly')
  const eliteMonthlyPrice = Number(eliteMonthlyPlan?.price || 0)
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
      base_plan_name: eliteBillingPlan ? `${eliteTier.name} ${billingCycle}` : `Elite ${billingCycle}`,
      base_price: eliteBasePrice.toFixed(2),
      hourly_rate: eliteHourlyRate.toFixed(2),
      sessions_per_week: customSessionsValue,
      session_duration_minutes: customMinutesValue,
      weekly_addon: customWeeklyAddon.toFixed(2),
      billing_cycle_addon: customCycleAddon.toFixed(2),
      monthly_addon: customCycleAddon.toFixed(2),
      total_price: customCycleTotal.toFixed(2),
    },
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
            alt="Fitness"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <FiZap className="text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">Transform Your Life — Not Just Your Body</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Your Personal
              <span className="block bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                Fitness Coach
              </span>
              Online
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Expert-designed programs, personalized nutrition, and real coaching — all from the comfort of your home. 
              Join 10,000+ people who transformed their lives with our science-backed approach.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                to={isAuthenticated ? '/dashboard' : '/onboarding'}
                className="btn btn-primary text-lg px-8 py-4 flex items-center space-x-2"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}</span>
                <FiArrowRight />
              </Link>
              <Link
                to={isAuthenticated ? '/profile' : '/onboarding'}
                className="btn text-lg px-8 py-4 bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur-sm flex items-center space-x-2"
              >
                <FiPlay size={18} />
                <span>View Programs</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6">
              {['No gym required', 'Cancel anytime', '7-day free trial'].map(item => (
                <div key={item} className="flex items-center space-x-2 text-gray-300">
                  <FiCheck className="text-green-400" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating stats */}
        <div className="absolute bottom-8 left-0 right-0 z-10">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="glass-effect rounded-2xl p-4 text-center text-white">
                  <p className="text-2xl font-black text-orange-400">{stat.value}</p>
                  <p className="text-xs text-gray-300 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why <span className="gradient-text">FitCoach Pro</span> Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We combine expert knowledge, personalized plans, and community support to deliver real, lasting results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group relative bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COACHES */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1920&q=80" alt="bg" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/85" />
        </div>
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Meet Your <span className="gradient-text">Expert Coaches</span>
            </h2>
            <p className="text-gray-400 text-lg">Certified professionals dedicated to your transformation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coaches.map((coach, i) => (
              <div key={i} className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="relative h-64 overflow-hidden">
                  <img src={coach.img} alt={coach.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-xl mb-1">{coach.name}</h3>
                  <p className="text-orange-400 text-sm font-medium mb-3">{coach.specialty}</p>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>⏱ {coach.experience} exp</span>
                    <span>👥 {coach.clients} clients</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSFORMATION SECTION */}
      <section className="section bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Real People.<br />Real Results.
              </h2>
              <p className="text-white/80 text-lg mb-8">
                Our members don't just lose weight or gain muscle — they gain confidence, energy, and a completely new relationship with their bodies.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Avg. Weight Lost', value: '24 lbs' },
                  { label: 'Avg. Muscle Gained', value: '8 lbs' },
                  { label: 'Energy Increase', value: '3x' },
                  { label: 'Members Active', value: '10K+' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
                    <p className="text-2xl font-black">{item.value}</p>
                    <p className="text-sm text-white/70">{item.label}</p>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-4 inline-flex items-center space-x-2">
                <span>Start Your Transformation</span>
                <FiArrowRight />
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80"
                alt="Transformation"
                className="rounded-2xl shadow-2xl w-full object-cover h-96"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <FiTrendingUp className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Progress Update</p>
                    <p className="text-green-600 text-xs">+15% strength this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section bg-gray-950">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              What Our <span className="gradient-text">Members Say</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-800 relative">
              <div className="text-6xl text-orange-500/30 font-serif absolute top-6 left-8">"</div>
              <div className="relative z-10">
                <p className="text-gray-300 text-xl leading-relaxed mb-8 italic">
                  {testimonials[activeTestimonial].text}
                </p>
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonials[activeTestimonial].avatar}
                    alt={testimonials[activeTestimonial].name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-orange-500"
                  />
                  <div>
                    <p className="text-white font-bold">{testimonials[activeTestimonial].name}</p>
                    <p className="text-orange-400 text-sm">{testimonials[activeTestimonial].role}</p>
                    <div className="flex text-yellow-400 mt-1">
                      {[...Array(5)].map((_, i) => <FiStar key={i} className="fill-current" size={14} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-3 h-3 rounded-full transition-all ${i === activeTestimonial ? 'bg-orange-500 w-8' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-32 bg-[#0f172a] relative overflow-hidden" id="pricing">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>
        <div className="container relative z-10 px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <FiZap className="text-orange-400" />
              <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Select Your Package</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Access</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-10 font-medium">
              Choose the level of intensity your transformation requires.
            </p>

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

          <div className="max-w-7xl mx-auto">
            {showOnlyUpgrades && (
              <div className="mb-6">
                <h4 className="text-sm text-slate-400 font-black mb-3">Your current plan</h4>
                {tiers.find(t => t.name.toLowerCase() === currentTierName) ? (
                  (() => {
                    const cur = tiers.find(t => t.name.toLowerCase() === currentTierName)
                    const curPkg = cur?.plans?.find(p => p.billing_cycle === billingCycle)
                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <PlanCard
                          tier={cur}
                          pkg={curPkg}
                          billingCycle={billingCycle}
                          idx={currentTierIndex}
                          currentTierName={currentTierName}
                          currentTierIndex={currentTierIndex}
                          isAuthenticated={isAuthenticated}
                          isInRenewalWindow={subscription?.is_in_renewal_window}
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
                const pkg = tier.plans.find(p => p.billing_cycle === billingCycle)
                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <PlanCard
                      tier={tier}
                      pkg={pkg}
                      billingCycle={billingCycle}
                      idx={idx}
                      currentTierName={currentTierName}
                      currentTierIndex={currentTierIndex}
                      isAuthenticated={isAuthenticated}
                      isInRenewalWindow={subscription?.is_in_renewal_window}
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
                  Your custom pkg starts with the Elite pkg for the selected billing cycle and adds personalized 1-on-1 coaching time tailored to your specific goals and schedule.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Sessions / week</span>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={customSessionsValue}
                      onChange={(e) => setCustomSessionsPerWeek(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    {customSessionsValue >= 7 && <p className="text-[9px] text-orange-400 font-bold mt-1">MAX CAPACITY: 1 SESSION / DAY</p>}
                  </label>
                  <label className="space-y-2">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Session length (min)</span>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={customMinutesValue}
                      onChange={(e) => setCustomSessionMinutes(Math.min(120, Math.max(15, Number(e.target.value) || 15)))}
                      className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-orange-500"
                    />
                    {customMinutesValue >= 120 && <p className="text-[9px] text-orange-400 font-bold mt-1">MAX INTENSITY: 2 HOURS</p>}
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 md:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5">{activeCustomConfig ? 'Current Custom Plan' : 'Price Breakdown'}</p>
                {activeCustomConfig && (
                  <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-green-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-300 mb-1">Active custom subscription</p>
                    <p className="text-sm font-bold">{activeCustomConfig.sessions_per_week} sessions/week · {activeCustomConfig.session_duration_minutes} min each</p>
                    <p className="text-[10px] text-green-200/80 mt-2">Current billing cycle: {activeCustomConfig.billing_cycle}</p>
                  </div>
                )}
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-4">
                    <span>{eliteBillingPlan ? `${eliteTier.name} ${billingCycle} base` : 'Elite base plan'}</span>
                    <div className="text-right">
                      {billingCycle !== 'monthly' && (
                        <span className="text-slate-500 line-through text-xs mr-2">
                          ${(eliteMonthlyPrice * (billingCycle === 'quarterly' ? 3 : 12)).toFixed(2)}
                        </span>
                      )}
                      <span className="font-black text-white">${eliteBasePrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Live coaching per week</span>
                    <span className="font-black text-white">{customSessionsValue} x {customMinutesValue} min</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Weekly add-on</span>
                    <span className="font-black text-white">${customWeeklyAddon.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Coaching Add-on ({billingCycle})</span>
                    <div className="text-right">
                      {billingCycle !== 'monthly' && (
                        <span className="text-slate-500 line-through text-xs mr-2">
                          ${(customWeeklyAddon * (billingCycle === 'quarterly' ? 13 : 52)).toFixed(2)}
                        </span>
                      )}
                      <span className="font-black text-white">${customCycleAddon.toFixed(2)}</span>
                      {billingCycle !== 'monthly' && (
                        <p className="text-[10px] text-orange-400 font-bold">
                          {billingCycle === 'quarterly' ? '10% DISCOUNT' : '20% DISCOUNT'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">{billingCycleLabels[billingCycle] || 'Total'}</p>
                    <p className="text-4xl font-black text-white">${customCycleTotal.toFixed(2)}</p>
                  </div>
                  <Link
                    to={isAuthenticated ? "/payment" : "/onboarding"}
                    state={{ pkg: customCoachPlan }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02]"
                  >
                    {activeCustomConfig ? 'Upgrade Custom Plan' : 'Continue to Custom Checkout'}
                    <FiArrowRight />
                  </Link>
                </div>

                </div>
              </div>
            </motion.div>
          </div>
        </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80" alt="CTA" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-pink-600/90" />
        </div>
        <div className="container relative z-10 text-center">
          <FiHeart className="text-white text-5xl mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Your Best Self<br />Starts Today
          </h2>
          <p className="text-white/80 text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of people who stopped making excuses and started making progress. 
            Your transformation is one click away.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="btn bg-white text-orange-600 hover:bg-gray-100 text-lg px-10 py-4 flex items-center space-x-2"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Free — No Credit Card'}</span>
              <FiArrowRight />
            </Link>
            <Link to="/subscriptions" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-4">
              View All Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
