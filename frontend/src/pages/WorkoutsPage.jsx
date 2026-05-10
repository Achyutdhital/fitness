import React, { useEffect, useState } from 'react'
import { workoutAPI, coreAPI } from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiClock, FiZap, FiStar, FiFilter, FiLock, FiUnlock } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const WorkoutsPage = () => {
  const { user, subscription } = useAuth()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [programs, setPrograms] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState('programs') // Default to structured programs
  const [filters, setFilters] = useState({ category: '', difficulty_level: '' })
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [filters, search, viewType])

  const loadData = async () => {
    setLoading(true)
    try {
      if (viewType === 'library') {
        const params = { ...filters }
        if (search) params.search = search
        const [workoutsRes, catsRes] = await Promise.all([
          workoutAPI.getWorkouts(params),
          categories.length === 0 ? workoutAPI.getCategories() : Promise.resolve({ data: categories })
        ])
        setWorkouts(workoutsRes.data.results || workoutsRes.data)
        setCategories(catsRes.data.results || catsRes.data)
      } else {
        const res = await workoutAPI.getPrograms()
        setPrograms(res.data.results || res.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (workoutId) => {
    if (!user) {
      navigate('/login')
      return
    }
    setUnlockingId(workoutId)
    try {
      const response = await coreAPI.unlockItem({ workout_id: workoutId })
      alert(response.data.message)
      loadData() // refresh
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to unlock')
    } finally {
      setUnlockingId(null)
    }
  }

  const isFreeTier = !subscription?.tier_details || subscription.tier_details.name.toLowerCase() === 'free'
  
  const isWorkoutLocked = (workout) => {
    if (!isFreeTier) return false // Paid users have full access
    if (workout.difficulty_level === 'beginner') return false // Beginner is free
    // Check if user has active unlock (mocked check for now)
    return true 
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
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
              Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Training</span>
            </h1>
            
            {/* View Type Switcher */}
            <div className="flex bg-gray-800/50 p-1 rounded-2xl w-fit border border-gray-700/50">
              <button 
                onClick={() => setViewType('programs')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'programs' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Structured Programs
              </button>
              <button 
                onClick={() => setViewType('library')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'library' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Single Sessions
              </button>
            </div>
          </div>
          
          {isFreeTier && (
            <div className="bg-blue-600/10 border border-blue-500/30 px-6 py-4 rounded-3xl flex items-center space-x-4">
              <div className="text-blue-400 w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center"><FiZap size={20} /></div>
              <div>
                <p className="text-white font-black text-sm mb-0.5">Free Access Points</p>
                <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">{user?.points?.total_points || 0} PTS Available</p>
              </div>
            </div>
          )}
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
              className="input-field pl-12 bg-gray-800 text-white border-gray-700 w-full rounded-2xl h-14"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.difficulty_level}
              onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700 rounded-2xl h-12"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner (Free)</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field bg-gray-800 text-white border-gray-700 rounded-2xl h-12"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Assembling Protocol...</p>
          </div>
        ) : viewType === 'library' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workouts.length > 0 ? workouts.map((workout, idx) => (
              <WorkoutCard key={workout.id} workout={workout} idx={idx} />
            )) : (
              <div className="col-span-full text-center py-20 bg-gray-800/20 rounded-[3rem] border border-gray-700/50">
                <FiFilter className="text-gray-700 mx-auto mb-6" size={64} />
                <h3 className="text-white font-black text-2xl mb-2">No Workouts Found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or searching for something else.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.length > 0 ? programs.map((program) => (
              <div 
                key={program.id}
                className="group bg-gray-800/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-gray-700 hover:border-pink-500/30 transition-all duration-500 flex flex-col h-full"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={program.thumbnail || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={program.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                      {program.phases?.length || 0} Phases
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-orange-400 transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-8 line-clamp-2 leading-relaxed">
                    {program.description}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <span>Timeline</span>
                      <span className="text-gray-300">Structured Stages</span>
                    </div>
                    <Link 
                      to={`/programs/${program.id}`}
                      className="w-full py-4 bg-gray-700 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center block transition-all"
                    >
                      Explore Program
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
               <div className="col-span-full text-center py-20 bg-gray-800/20 rounded-[3rem] border border-gray-700/50">
                <FiActivity className="text-gray-700 mx-auto mb-6" size={64} />
                <h3 className="text-white font-black text-2xl mb-2">No Programs Available</h3>
                <p className="text-gray-500 text-sm">Check back later for new expert-designed plans.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkoutsPage

// Sub-component for individual workout card
const WorkoutCard = ({ workout, idx }) => {
  const { subscription } = useAuth()
  const isFreeTier = !subscription?.tier_details || subscription.tier_details.name.toLowerCase() === 'free'
  const locked = isFreeTier && workout.difficulty_level !== 'beginner'

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-400 border-green-500/50',
      intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      advanced: 'bg-red-500/20 text-red-400 border-red-500/50',
    }
    return colors[level] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }

  return (
    <div className="group bg-gray-800/40 backdrop-blur-sm rounded-[2rem] overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all duration-300 flex flex-col h-full">
      <div className="relative h-56 overflow-hidden">
        <img
          src={workout.thumbnail || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600'}
          alt={workout.title}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${locked ? 'blur-sm grayscale brightness-50' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getDifficultyColor(workout.difficulty_level)}`}>
          {workout.difficulty_level}
        </div>
      </div>

      <div className="p-8 flex flex-col flex-1">
        <h3 className="text-white font-black text-xl mb-3 group-hover:text-orange-400 transition-colors">{workout.title}</h3>
        <p className="text-gray-500 text-xs font-medium mb-6 line-clamp-2 leading-relaxed">{workout.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-4 text-gray-400">
            <div className="flex items-center space-x-1.5">
              <FiClock size={14} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{workout.duration_minutes}m</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <FiZap size={14} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{workout.calories_burnt || 0}c</span>
            </div>
          </div>
          <Link to={`/workouts/${workout.id}`} className="px-5 py-2.5 bg-gray-700 hover:bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
            Start
          </Link>
        </div>
      </div>
    </div>
  )
}
