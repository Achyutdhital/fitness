import React, { useEffect, useMemo, useState } from 'react'
import { workoutAPI, coreAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiSearch, FiClock, FiUsers, FiHeart, FiX, FiLock, FiCheck, FiZap, FiUnlock } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1200',
  'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1200',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200',
]

const normalizePlan = (plan, index = 0) => ({
  id: plan.id,
  title: plan.title,
  description: plan.description,
  dietary_type: plan.dietary_type,
  difficulty_level: plan.difficulty_level,
  calories: plan.calories_per_day,
  protein: plan.protein_grams,
  carbs: plan.carbs_grams,
  fats: plan.fats_grams,
  duration_days: plan.duration_days,
  meals_per_day: plan.meals_per_day,
  image: plan.thumbnail || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
  meals: plan.meals || [],
  created_at: plan.created_at,
})

const getDietBadgeColor = (diet) => {
  const colors = {
    regular: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    vegetarian: 'bg-green-500/20 text-green-400 border-green-500/40',
    vegan: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    keto: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    paleo: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    gluten_free: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  }
  return colors[diet] || colors.regular
}

const MealPlansPage = () => {
  const { user, subscription, fetchUser } = useAuth()
  const navigate = useNavigate()
  const [mealPlans, setMealPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [unlockingId, setUnlockingId] = useState(null)
  const [filters, setFilters] = useState({
    dietary_type: '',
    difficulty_level: '',
  })

  const isFreeTier = !subscription?.tier_details || subscription.tier_details.name.toLowerCase() === 'free'
  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())

  useEffect(() => {
    loadMealPlans()
  }, [filters, search])

  const loadMealPlans = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (search) params.search = search

      const response = await workoutAPI.getMealPlans(params)
      const list = response.data.results || response.data || []
      setMealPlans(list.map((plan, index) => normalizePlan(plan, index)))
    } catch (error) {
      console.error('Failed to load meal plans:', error)
      setMealPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (e, planId) => {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    setUnlockingId(planId)
    try {
      const response = await coreAPI.unlockItem({ meal_plan_id: planId })
      alert(response.data.message)
      fetchUser() // refresh points
      loadMealPlans()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to unlock')
    } finally {
      setUnlockingId(null)
    }
  }

  const isPlanLocked = (pkg) => {
    if (!isFreeTier) return false
    if (pkg.difficulty_level === 'beginner') return false
    return true // Simplified for demo
  }

  const filteredPlans = useMemo(() => {
    return mealPlans.filter((pkg) => {
      const matchesSearch = !search || pkg.title?.toLowerCase().includes(search.toLowerCase()) || pkg.description?.toLowerCase().includes(search.toLowerCase())
      const matchesDiet = !filters.dietary_type || pkg.dietary_type === filters.dietary_type
      const matchesDifficulty = !filters.difficulty_level || pkg.difficulty_level === filters.difficulty_level
      return matchesSearch && matchesDiet && matchesDifficulty
    })
  }, [mealPlans, search, filters])

  const openPlan = (pkg) => {
    if (isPlanLocked(pkg)) {
      // Don't open if locked, just show the card interaction
      return
    }
    setSelectedPlan(pkg)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              Nutrition <span className="gradient-text">Plans</span>
            </h1>
            <p className="text-gray-400 text-lg">Meal plans and nutrition guidance built around your goals</p>
          </div>
          {isFreeTier && (
            <div className="bg-blue-600/10 border border-blue-500/30 px-6 py-3 rounded-2xl flex items-center space-x-4">
              <div className="text-blue-400"><FiZap size={20} /></div>
              <div>
                <p className="text-white font-black text-sm leading-none mb-1">Free Tier Points</p>
                <p className="text-blue-300 text-xs font-bold">{user?.points?.total_points || 0} PTS</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meal plans..."
              className="input-field pl-12 bg-gray-800 text-white border-gray-700 w-full rounded-2xl h-14"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.difficulty_level}
              onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700 rounded-2xl h-12"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner (Free)</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.dietary_type}
              onChange={(e) => setFilters({ ...filters, dietary_type: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700 rounded-2xl h-12"
            >
              <option value="">All Diet Types</option>
              <option value="regular">Regular</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="gluten_free">Gluten Free</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((pkg) => {
              const locked = isPlanLocked(pkg)
              
              return (
                <button
                  key={pkg.id}
                  onClick={() => openPlan(pkg)}
                  className="group text-left bg-gray-800/40 backdrop-blur-sm rounded-[2rem] overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${locked ? 'blur-sm grayscale brightness-50' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
                    
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-orange-500 to-pink-500 capitalize">
                      {pkg.difficulty_level || 'plan'}
                    </div>
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getDietBadgeColor(pkg.dietary_type)}`}>
                      {pkg.dietary_type?.replace('_', ' ') || 'regular'}
                    </div>

                    {locked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white mb-4">
                          <FiLock size={24} />
                        </div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">Premium Plan</p>
                        <p className="text-gray-300 text-[10px] font-bold mt-1">Unlock with 100 Points</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-white font-black text-xl mb-3 group-hover:text-orange-400 transition-colors">
                      {pkg.title}
                    </h3>
                    <p className="text-gray-500 text-xs font-medium mb-6 line-clamp-2 leading-relaxed">{pkg.description}</p>

                    <div className="grid grid-cols-4 gap-3 mb-8">
                      <div className="bg-gray-900/50 rounded-2xl p-2 text-center border border-gray-700/50">
                        <p className="text-orange-400 font-black text-sm">{pkg.calories}</p>
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-tighter">cal</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-2xl p-2 text-center border border-gray-700/50">
                        <p className="text-blue-400 font-black text-sm">{pkg.protein}g</p>
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-tighter">prot</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-2xl p-2 text-center border border-gray-700/50">
                        <p className="text-green-400 font-black text-sm">{pkg.duration_days}</p>
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-tighter">days</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-2xl p-2 text-center border border-gray-700/50">
                        <p className="text-yellow-400 font-black text-sm">{pkg.meals_per_day}</p>
                        <p className="text-gray-600 text-[9px] font-black uppercase tracking-tighter">meals</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-700/50">
                      {locked ? (
                        <button
                          onClick={(e) => handleUnlock(e, pkg.id)}
                          disabled={unlockingId === pkg.id}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
                        >
                          {unlockingId === pkg.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiUnlock />
                              <span>Unlock for 7 Days</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-4 bg-gray-700 group-hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all">
                          View Full Details
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-800/20 rounded-[3rem] border border-gray-700/50">
             <FiSearch className="text-gray-700 mx-auto mb-6" size={64} />
             <h3 className="text-white font-black text-2xl mb-2">No Plans Found</h3>
             <p className="text-gray-500 text-sm">Try adjusting your filters or searching for something else.</p>
          </div>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl relative flex flex-col">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-6 right-6 z-10 bg-gray-800/80 backdrop-blur-md p-3 rounded-2xl text-white hover:bg-orange-500 transition-all shadow-lg"
            >
              <FiX size={24} />
            </button>

            <div className="flex-1 overflow-y-auto">
              <div className="relative h-80">
                <img src={selectedPlan.image} alt={selectedPlan.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {selectedPlan.difficulty_level}
                    </span>
                    <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {selectedPlan.dietary_type}
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white">{selectedPlan.title}</h2>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 text-center">
                    <p className="text-orange-400 font-black text-3xl mb-1">{selectedPlan.calories}</p>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Daily Cal</p>
                  </div>
                  <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 text-center">
                    <p className="text-blue-400 font-black text-3xl mb-1">{selectedPlan.protein}g</p>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Protein</p>
                  </div>
                  <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 text-center">
                    <p className="text-green-400 font-black text-3xl mb-1">{selectedPlan.carbs}g</p>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Carbs</p>
                  </div>
                  <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 text-center">
                    <p className="text-yellow-400 font-black text-3xl mb-1">{selectedPlan.fats}g</p>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Fats</p>
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-white font-black text-2xl mb-6 flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm">01</span>
                    <span>Plan Overview</span>
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-lg">{selectedPlan.description}</p>
                </div>

                {selectedPlan.meals.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-white font-black text-2xl mb-6 flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">02</span>
                      <span>Daily Menu</span>
                    </h3>
                    <div className="space-y-4">
                      {selectedPlan.meals.map((meal, index) => (
                        <div key={meal.id || index} className="group bg-gray-800/30 hover:bg-gray-800/50 p-6 rounded-3xl border border-gray-700 transition-all">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <FiHeart size={20} />
                              </div>
                              <div>
                                <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Day {meal.day} · {meal.meal_type}</p>
                                <p className="text-white font-bold text-lg">{meal.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-black text-sm">{meal.calories} cal</p>
                              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{meal.preparation_time_minutes} min prep</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed">{meal.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 border-t border-gray-800 bg-gray-900/50 backdrop-blur-md">
              <button 
                onClick={() => setSelectedPlan(null)}
                className="w-full py-5 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MealPlansPage
