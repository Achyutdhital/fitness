import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiTarget, FiBarChart2, FiZap, FiCheck, FiLock, FiArrowRight, FiCalendar, FiHeart } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const EnhancedDashboard = () => {
  const { user, subscription } = useAuth()
  const [bodyData, setBodyData] = useState(null)
  const [calculations, setCalculations] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Use persisted backend profile metrics.
    if (user) {
      calculateBodyMetrics()
    }
  }, [user])

  const calculateBodyMetrics = () => {
    if (!user || !user.weight || !user.height_ft) {
      setBodyData(null)
      return
    }

    const heightInches = (parseInt(user.height_ft || 0) * 12) + parseInt(user.height_in || 0)
    const weightLbs = parseFloat(user.weight || 0)
    const idealWeightLow = (21 * heightInches * heightInches) / 703
    const idealWeightHigh = (24 * heightInches * heightInches) / 703
    const preferredUnits = user.preferred_units || 'imperial'
    const displayWeight = preferredUnits === 'metric' ? (weightLbs / 2.20462).toFixed(1) : weightLbs.toFixed(1)
    const displayWeightUnit = preferredUnits === 'metric' ? 'kg' : 'lb'

    setBodyData({
      height: `${user.height_ft}'${user.height_in}"`,
      weight: displayWeight,
      weightUnit: displayWeightUnit,
      age: user.age,
      gender: user.gender,
      heightInches,
    })

    setCalculations({
      bmi: user.bmi || 'N/A',
      bodyFat: user.body_fat_percentage || 'N/A',
      muscleMass: user.muscle_mass_kg || 'N/A',
      bmr: user.bmr || 0,
      tdee: user.tdee || 0,
      idealWeightLow: idealWeightLow.toFixed(0),
      idealWeightHigh: idealWeightHigh.toFixed(0),
      goal: user.fitness_goal || 'maintain',
      activityLevel: user.activity_level || 'moderately_active',
    })
  }

  // Free features
  const freeFeatures = [
    { icon: FiBarChart2, title: 'Body Metrics', description: 'Height, weight, age analysis' },
    { icon: FiTrendingUp, title: 'BMI Calculator', description: 'Real-time body composition' },
    { icon: FiTarget, title: 'Calorie Estimate', description: 'BMR and TDEE calculations' },
  ]

  // Locked features (Pro+)
  const lockedFeatures = [
    { icon: FiZap, title: 'AI Coach', description: 'Personalized workout plans', tier: 'Pro' },
    { icon: FiHeart, title: 'Meal Planner', description: 'AI-generated meal plans', tier: 'Pro' },
    { icon: FiCalendar, title: 'Trainer Sessions', description: '1-on-1 coaching calls', tier: 'Elite' },
  ]

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Pro': return 'from-purple-500 to-indigo-500'
      case 'Elite': return 'from-orange-500 to-pink-500'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const currentTier = subscription?.tier_details?.name || 'Free'
  const isProOrHigher = ['Pro', 'Elite', 'Custom'].includes(currentTier)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2">Welcome, {user?.first_name || 'Champion'}! 💪</h1>
          <p className="text-slate-400 text-lg">Your fitness journey starts here</p>
        </motion.div>

        {/* Body Metrics Overview */}
        {bodyData && calculations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Current Weight</p>
                  <p className="text-3xl font-bold text-white">{bodyData.weight}</p>
                  <p className="text-blue-300 text-xs mt-1">{bodyData.weightUnit}</p>
                </div>
                <FiTrendingUp className="text-blue-400" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">BMI</p>
                  <p className="text-3xl font-bold text-white">{calculations.bmi}</p>
                  <p className="text-purple-300 text-xs mt-1">kg/m²</p>
                </div>
                <FiBarChart2 className="text-purple-400" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Est. Body Fat</p>
                  <p className="text-3xl font-bold text-white">{calculations.bodyFat}%</p>
                  <p className="text-orange-300 text-xs mt-1">Estimated</p>
                </div>
                <FiBarChart2 className="text-orange-400" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Muscle Mass</p>
                  <p className="text-3xl font-bold text-white">{calculations.muscleMass}</p>
                  <p className="text-green-300 text-xs mt-1">kg (estimated)</p>
                </div>
                <FiZap className="text-green-400" size={32} />
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Free Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FiCheck className="text-green-400" />
                Your Free Features
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {freeFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 hover:border-slate-500 transition-all"
                  >
                    <feature.icon className="text-green-400 mb-3" size={24} />
                    <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>

              {bodyData && calculations && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">Your Body Profile</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Height</p>
                      <p className="text-white font-semibold">{bodyData.height}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Age</p>
                      <p className="text-white font-semibold">{bodyData.age} years</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Fitness Goal</p>
                      <p className="text-white font-semibold capitalize">{calculations.goal.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Activity Level</p>
                      <p className="text-white font-semibold capitalize">{calculations.activityLevel.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Ideal Weight Range</p>
                      <p className="text-white font-semibold">{calculations.idealWeightLow} - {calculations.idealWeightHigh} lbs</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Basal Metabolic Rate</p>
                      <p className="text-white font-semibold">{calculations.bmr} cal/day</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Locked Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FiLock className="text-amber-400" />
                Unlock Premium Features
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lockedFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-slate-700/30 to-slate-700/10 border border-slate-600/50 rounded-xl p-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <feature.icon className="text-amber-400" size={24} />
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white bg-gradient-to-r ${getTierColor(feature.tier)}`}>
                          {feature.tier}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                      <p className="text-slate-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Subscription & Upgrade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Current pkg */}
            <div className={`bg-gradient-to-br ${currentTier === 'Free' ? 'from-slate-600 to-slate-700' : currentTier === 'Pro' ? 'from-purple-600 to-indigo-600' : 'from-orange-600 to-pink-600'} rounded-2xl p-6 text-white`}>
              <p className="text-sm opacity-80 mb-1">Current Plan</p>
              <h3 className="text-3xl font-black mb-4">{currentTier}</h3>

              {currentTier === 'Free' ? (
                <>
                  <p className="text-sm opacity-90 mb-6">Get unlimited access to personalized coaching and advanced analytics.</p>
                  <Link
                    to="/subscriptions"
                    className="w-full bg-white text-slate-900 hover:bg-slate-50 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    Upgrade Now
                    <FiArrowRight size={18} />
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm opacity-90">You're all set! Enjoy premium features.</p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs opacity-75 mb-1">Next billing date</p>
                    <p className="font-semibold">{subscription?.next_billing_date || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <p className="text-slate-400">Account Status</p>
                  <p className="text-green-400 font-semibold">Active</p>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <p className="text-slate-400">Member Since</p>
                  <p className="text-white font-semibold">{user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Today'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">Profile Complete</p>
                  <p className="text-orange-400 font-semibold">{bodyData ? '100%' : '50%'}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/workouts"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30"
            >
              Start Workout
              <FiArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard
