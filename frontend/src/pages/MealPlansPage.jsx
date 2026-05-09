import React, { useEffect, useMemo, useState } from 'react'
import { workoutAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiSearch, FiClock, FiUsers, FiHeart, FiX, FiLock, FiCheck } from 'react-icons/fi'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1200',
  'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1200',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200',
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200',
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
  const { subscription } = useAuth()
  const [mealPlans, setMealPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [filters, setFilters] = useState({
    dietary_type: '',
    difficulty_level: '',
  })

  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())
  const daysRemaining = subscription?.end_date ? Math.max(0, Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null

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

  const filteredPlans = useMemo(() => {
    return mealPlans.filter((plan) => {
      const matchesSearch = !search || plan.title?.toLowerCase().includes(search.toLowerCase()) || plan.description?.toLowerCase().includes(search.toLowerCase())
      const matchesDiet = !filters.dietary_type || plan.dietary_type === filters.dietary_type
      const matchesDifficulty = !filters.difficulty_level || plan.difficulty_level === filters.difficulty_level
      return matchesSearch && matchesDiet && matchesDifficulty
    })
  }, [mealPlans, search, filters])

  const openPlan = (plan) => {
    if (!isSubscriptionActive) {
      setSelectedPlan({ ...plan, locked: true })
      return
    }
    setSelectedPlan(plan)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Nutrition <span className="gradient-text">Plans</span>
          </h1>
          <p className="text-gray-400 text-lg">Meal plans and nutrition guidance built around your goals</p>
          {subscription?.subscription_plan && (
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-sm text-orange-100">
              <span className="font-semibold">Subscription:</span>
              <span>{subscription.subscription_plan.name}</span>
              <span className="text-orange-300">{isSubscriptionActive ? `${daysRemaining ?? 0} days left` : 'Expired'}</span>
            </div>
          )}
        </div>

        {!isSubscriptionActive && subscription?.subscription_plan && (
          <div className="mb-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-100">
            <div className="flex items-start gap-3">
              <FiLock className="mt-1" />
              <div>
                <p className="font-bold mb-1">Your subscription has ended</p>
                <p className="text-sm text-yellow-100/80">Meal plan details stay saved in your account, but full access requires an active subscription.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meal plans..."
              className="input-field pl-12 bg-gray-800 text-white border-gray-700 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.difficulty_level}
              onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.dietary_type}
              onChange={(e) => setFilters({ ...filters, dietary_type: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => openPlan(plan)}
                className="group text-left bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={plan.image}
                    alt={plan.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 capitalize">
                    {plan.difficulty_level || 'plan'}
                  </div>
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${getDietBadgeColor(plan.dietary_type)}`}>
                    {plan.dietary_type?.replace('_', ' ') || 'regular'}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-orange-400 transition-colors">
                    {plan.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plan.description}</p>

                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="bg-gray-900 rounded-lg p-2">
                      <p className="text-orange-400 font-bold text-sm">{plan.calories}</p>
                      <p className="text-gray-500 text-xs">cal</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-2">
                      <p className="text-blue-400 font-bold text-sm">{plan.protein}g</p>
                      <p className="text-gray-500 text-xs">protein</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-2">
                      <p className="text-green-400 font-bold text-sm">{plan.duration_days}</p>
                      <p className="text-gray-500 text-xs">days</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-2">
                      <p className="text-yellow-400 font-bold text-sm">{plan.meals_per_day}</p>
                      <p className="text-gray-500 text-xs">meals</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-gray-400 text-sm">
                    <div className="flex items-center space-x-1">
                      <FiClock size={14} />
                      <span>{plan.duration_days} days</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiUsers size={14} />
                      <span>{plan.meals?.length || plan.meals_per_day || 0} meals</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No meal plans found</p>
          </div>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="relative h-64">
              <img src={selectedPlan.image} alt={selectedPlan.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">{selectedPlan.title}</h2>
                  <p className="text-gray-400">{selectedPlan.description}</p>
                </div>
                {selectedPlan.locked && <FiLock className="text-yellow-400 flex-shrink-0 mt-2" size={22} />}
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8 mt-6">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-orange-400 font-black text-2xl">{selectedPlan.calories}</p>
                  <p className="text-gray-500 text-sm">Calories</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-blue-400 font-black text-2xl">{selectedPlan.protein}g</p>
                  <p className="text-gray-500 text-sm">Protein</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-green-400 font-black text-2xl">{selectedPlan.carbs}g</p>
                  <p className="text-gray-500 text-sm">Carbs</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-yellow-400 font-black text-2xl">{selectedPlan.fats}g</p>
                  <p className="text-gray-500 text-sm">Fats</p>
                </div>
              </div>

              {selectedPlan.locked ? (
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-yellow-100">
                  <div className="flex items-start gap-3">
                    <FiLock className="mt-1" />
                    <div>
                      <p className="font-bold mb-1">Renew your subscription to open this plan</p>
                      <p className="text-sm text-yellow-100/80">Your data stays saved after expiry, but the full nutrition details are locked until you reactivate access.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {selectedPlan.meals.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-white font-bold text-xl mb-4">Daily Meals</h3>
                      <div className="space-y-3">
                        {selectedPlan.meals.map((meal, index) => (
                          <div key={meal.id || index} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div>
                                <p className="text-white font-semibold">Day {meal.day} - {meal.meal_type}</p>
                                <p className="text-gray-400 text-sm">{meal.name}</p>
                              </div>
                              <div className="text-right text-sm text-gray-400">
                                <p>{meal.calories} cal</p>
                                <p>{meal.preparation_time_minutes} min</p>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{meal.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPlan.meals.length === 0 && (
                    <div className="mb-8 rounded-2xl border border-gray-700 bg-gray-800 p-5 text-gray-300 text-sm">
                      Detailed meal breakdown will appear here once meals are attached to this plan in the CMS.
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-white font-bold text-xl mb-4">Nutrition Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-800 rounded-xl p-4 text-center">
                        <p className="text-orange-400 font-black text-2xl">{selectedPlan.duration_days}</p>
                        <p className="text-gray-500 text-sm">Days</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 text-center">
                        <p className="text-blue-400 font-black text-2xl">{selectedPlan.meals_per_day}</p>
                        <p className="text-gray-500 text-sm">Meals/Day</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 text-center">
                        <p className="text-green-400 font-black text-2xl">{selectedPlan.dietary_type?.replace('_', ' ')}</p>
                        <p className="text-gray-500 text-sm">Diet Type</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 text-center">
                        <p className="text-yellow-400 font-black text-2xl">{selectedPlan.difficulty_level}</p>
                        <p className="text-gray-500 text-sm">Difficulty</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => setSelectedPlan(null)}
                className="btn btn-primary w-full mt-8 flex items-center justify-center space-x-2"
              >
                <FiCheck size={16} />
                <span>Close Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MealPlansPage
