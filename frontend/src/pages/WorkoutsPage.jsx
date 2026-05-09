import React, { useEffect, useState } from 'react'
import { workoutAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { FiSearch, FiClock, FiZap, FiStar, FiFilter } from 'react-icons/fi'

const WorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: '', difficulty_level: '' })
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [filters, search])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters }
      if (search) params.search = search

      const workoutsResponse = await workoutAPI.getWorkouts(params)
      setWorkouts(workoutsResponse.data.results || workoutsResponse.data)

      if (categories.length === 0) {
        const categoriesResponse = await workoutAPI.getCategories()
        setCategories(categoriesResponse.data.results || categoriesResponse.data)
      }
    } catch (error) {
      console.error('Failed to load workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-400 border-green-500/50',
      intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      advanced: 'bg-red-500/20 text-red-400 border-red-500/50',
    }
    return colors[level] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }

  const fallbackImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Workout <span className="gradient-text">Library</span>
          </h1>
          <p className="text-gray-400 text-lg">Expert-designed programs for every fitness level</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workouts..."
              className="input-field pl-12 bg-gray-800 text-white border-gray-700 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.difficulty_level}
              onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Workout Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : workouts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout, idx) => (
              <Link
                key={workout.id}
                to={`/workouts/${workout.id}`}
                className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={workout.thumbnail || fallbackImages[idx % fallbackImages.length]}
                    alt={workout.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(workout.difficulty_level)}`}>
                    {workout.difficulty_level}
                  </div>
                  {workout.is_featured && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Featured
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-orange-400 transition-colors">
                    {workout.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{workout.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                      <div className="flex items-center space-x-1">
                        <FiClock size={14} />
                        <span>{workout.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiZap size={14} className="text-orange-400" />
                        <span>{workout.calories_per_session || 0} cal</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <FiStar size={14} className="fill-current" />
                      <span className="text-sm font-bold">{(workout.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FiFilter className="text-gray-600 mx-auto mb-4" size={48} />
            <p className="text-gray-400 text-xl mb-2">No workouts found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or add workouts from the admin panel</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkoutsPage
