import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { coreAPI, workoutAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiClock, FiZap, FiStar, FiLock, FiCheck, FiArrowLeft, FiPlayCircle } from 'react-icons/fi'

const fallbackImage = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600'

const WorkoutDetailPage = () => {
  const { id } = useParams()
  const { subscription, isAuthenticated } = useAuth()
  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [favorited, setFavorited] = useState(false)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())
  const daysRemaining = subscription?.end_date ? Math.max(0, Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null

  async function loadWorkout() {
    try {
      setLoading(true)
      setError(null)
      const response = await workoutAPI.getWorkoutDetails(id)
      setWorkout(response.data)
      if (isAuthenticated) {
        const [favRes, reviewRes] = await Promise.allSettled([
          coreAPI.getFavoriteWorkouts(),
          coreAPI.getWorkoutReviews(id),
        ])
        if (favRes.status === 'fulfilled') {
          const favorites = favRes.value.data || []
          setFavorited(favorites.some((f) => String(f.workout) === String(id)))
        }
        if (reviewRes.status === 'fulfilled') {
          setReviews(reviewRes.value.data || [])
        }
      }
    } catch (err) {
      console.error(err)
      setError('Workout details could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWorkout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
        <div className="container max-w-3xl">
          <Link to="/workouts" className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 mb-8">
            <FiArrowLeft />
            <span>Back to Workouts</span>
          </Link>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            {error || 'Workout not found'}
          </div>
        </div>
      </div>
    )
  }

  const locked = !isSubscriptionActive
  const image = workout.thumbnail || fallbackImage
  const getEmbedVideoUrl = (url) => {
    if (!url) return null
    try {
      const parsed = new URL(url)
      const host = parsed.hostname.replace('www.', '')

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.pathname.startsWith('/watch')) {
          const videoId = parsed.searchParams.get('v')
          return videoId ? `https://www.youtube.com/embed/${videoId}` : null
        }
        if (parsed.pathname.startsWith('/shorts/')) {
          const videoId = parsed.pathname.split('/shorts/')[1]
          return videoId ? `https://www.youtube.com/embed/${videoId}` : null
        }
      }

      if (host === 'youtu.be') {
        const videoId = parsed.pathname.split('/').filter(Boolean).pop()
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }

      if (host === 'vimeo.com') {
        const videoId = parsed.pathname.split('/').filter(Boolean).pop()
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null
      }
    } catch (error) {
      return null
    }
    return null
  }

  const toggleFavorite = async () => {
    try {
      const response = await coreAPI.toggleWorkoutFavorite(id)
      setFavorited(Boolean(response.data?.favorited))
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    try {
      await coreAPI.submitReview(id, rating, comment)
      const updated = await coreAPI.getWorkoutReviews(id)
      setReviews(updated.data || [])
      setComment('')
    } catch (err) {
      console.error('Failed to submit review:', err)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="relative h-96">
        <img src={image} alt={workout.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent" />
        <div className="absolute inset-0">
          <div className="container h-full flex items-end pb-10">
            <div className="max-w-4xl">
              <Link to="/workouts" className="inline-flex items-center space-x-2 text-orange-300 hover:text-white mb-6">
                <FiArrowLeft />
                <span>Back to Workouts</span>
              </Link>
              <div className="inline-flex items-center space-x-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white/90 mb-4">
                <span className="capitalize">{workout.difficulty_level}</span>
                <span>•</span>
                <span>{workout.category_name || 'Workout'}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4">{workout.title}</h1>
              <p className="text-lg md:text-xl text-gray-200 max-w-3xl">{workout.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12 space-y-8">
        {subscription?.subscription_plan && (
          <div className={`rounded-2xl border p-5 ${locked ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100' : 'border-green-500/30 bg-green-500/10 text-green-100'}`}>
            <div className="flex items-start gap-3">
              {locked ? <FiLock className="mt-1" /> : <FiCheck className="mt-1" />}
              <div>
                <p className="font-bold mb-1">{locked ? 'Subscription expired' : 'Access unlocked'}</p>
                <p className="text-sm opacity-80">
                  {locked
                    ? 'Renew to see the full workout steps, save your progress, and keep accessing premium content.'
                    : `You have ${daysRemaining ?? 0} day(s) left on ${subscription.subscription_plan.name}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-900/80 border border-gray-700 p-5 text-center">
                <FiClock className="mx-auto text-orange-400 mb-2" />
                <p className="text-white font-black text-xl">{workout.duration_minutes}</p>
                <p className="text-gray-400 text-sm">minutes</p>
              </div>
              <div className="rounded-2xl bg-gray-900/80 border border-gray-700 p-5 text-center">
                <FiZap className="mx-auto text-orange-400 mb-2" />
                <p className="text-white font-black text-xl">{workout.calories_burnt || 0}</p>
                <p className="text-gray-400 text-sm">calories</p>
              </div>
              <div className="rounded-2xl bg-gray-900/80 border border-gray-700 p-5 text-center">
                <FiStar className="mx-auto text-orange-400 mb-2" />
                <p className="text-white font-black text-xl">{Number(workout.rating || 0).toFixed(1)}</p>
                <p className="text-gray-400 text-sm">rating</p>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-8">
              <h2 className="text-2xl font-black text-white mb-4">Workout Overview</h2>
              <p className="text-gray-300 leading-relaxed mb-6">{workout.instructions || workout.description}</p>

              {workout.equipment_needed?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-3">Equipment Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {workout.equipment_needed.map((item, index) => (
                      <span key={index} className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 capitalize">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {workout.muscle_groups?.length > 0 && (
                <div>
                  <h3 className="text-white font-bold mb-3">Muscle Groups</h3>
                  <div className="flex flex-wrap gap-2">
                    {workout.muscle_groups.map((item, index) => (
                      <span key={index} className="rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-sm text-orange-200 capitalize">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {workout.video_url && (
              <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-8">
                <h2 className="text-2xl font-black text-white mb-4">Video Tutorial</h2>
                {getEmbedVideoUrl(workout.video_url) ? (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-gray-700 mb-4">
                    <iframe
                      title={`${workout.title} tutorial`}
                      src={getEmbedVideoUrl(workout.video_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm mb-4">
                    This workout includes a guided training video. Open it to follow along with the trainer.
                  </p>
                )}
                <a
                  href={workout.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <FiPlayCircle />
                  <span>Watch Full Tutorial</span>
                </a>
              </div>
            )}

            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-8">
              <h2 className="text-2xl font-black text-white mb-4">Exercises</h2>
              {workout.exercises?.length > 0 ? (
                <div className="space-y-4">
                  {workout.exercises.map((exercise, index) => (
                    <div key={exercise.id || index} className="rounded-2xl border border-gray-700 bg-gray-800/80 p-5">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="text-orange-400 text-sm font-semibold mb-1">Exercise {index + 1}</p>
                          <h3 className="text-white font-bold text-lg">{exercise.name}</h3>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          {exercise.sets && <p>{exercise.sets} sets</p>}
                          {exercise.reps && <p>{exercise.reps} reps</p>}
                          {exercise.duration_seconds && <p>{exercise.duration_seconds}s</p>}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{exercise.instructions || exercise.description}</p>
                      {exercise.video_url && (
                        <a
                          href={exercise.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-orange-300 hover:text-orange-200 text-sm font-semibold"
                        >
                          <FiPlayCircle />
                          <span>Watch exercise tutorial</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Exercise breakdown will appear once it is added in CMS.</p>
              )}
            </div>
            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-8">
              <h2 className="text-2xl font-black text-white mb-4">Ratings & Reviews</h2>
              <form onSubmit={submitReview} className="mb-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="input-field bg-gray-800 text-white border-gray-700"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review..."
                    className="input-field md:col-span-3 bg-gray-800 text-white border-gray-700"
                  />
                </div>
                <button type="submit" disabled={reviewLoading} className="btn btn-primary">
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-semibold">{review.username}</p>
                        <p className="text-orange-300 text-sm">{'★'.repeat(review.rating)}</p>
                      </div>
                      <p className="text-gray-300 text-sm">{review.comment || 'No comment provided.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-xl mb-4">Access</h2>
              {locked ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100 mb-4">
                    <FiLock />
                    <div>
                      <p className="font-semibold">Locked</p>
                      <p className="text-xs text-yellow-100/80">Renew your pkg to continue.</p>
                    </div>
                  </div>
                  <Link to="/subscriptions" className="btn btn-primary w-full block text-center">
                    Renew Subscription
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-100">
                  <FiCheck />
                  <div>
                    <p className="font-semibold">Available now</p>
                    <p className="text-xs text-green-100/80">This workout is unlocked for your plan.</p>
                  </div>
                </div>
              )}
              {!locked && (
                <button onClick={toggleFavorite} className="btn btn-primary w-full mt-4">
                  {favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              )}
            </div>

            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-xl mb-4">Details</h2>
              <dl className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between gap-4">
                  <dt>Category</dt>
                  <dd className="text-white">{workout.category_name || 'General'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Duration</dt>
                  <dd className="text-white">{workout.duration_minutes} min</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Calories</dt>
                  <dd className="text-white">{workout.calories_burnt || 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Featured</dt>
                  <dd className="text-white">{workout.is_featured ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default WorkoutDetailPage
