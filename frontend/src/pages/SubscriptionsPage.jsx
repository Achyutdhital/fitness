import React, { useEffect, useState } from 'react'
import { subscriptionAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { FiCheck, FiZap, FiStar } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const SubscriptionsPage = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, subscription } = useAuth()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans()
      setPlans(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-orange-500 to-pink-500',
      'from-purple-500 to-indigo-500',
    ]
    return colors[index % colors.length]
  }

  const getBillingLabel = (cycle) => {
    const labels = {
      monthly: 'month',
      quarterly: '3 months',
      yearly: 'year',
    }
    return labels[cycle] || cycle
  }

  const isActiveSubscription = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())
  const daysRemaining = subscription?.end_date ? Math.max(0, Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null

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
            <span className="text-orange-300 text-sm font-medium">7-Day Free Trial · Cancel Anytime</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Choose Your <span className="gradient-text">Transformation</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Select the perfect program for your fitness goals. All plans include expert coaching and personalized guidance.
          </p>
          {isAuthenticated && subscription?.subscription_plan && (
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-sm text-orange-100">
              <span className="font-semibold">Current plan:</span>
              <span>{subscription.subscription_plan.name}</span>
              <span className="text-orange-300">{isActiveSubscription ? `${daysRemaining ?? 0} days left` : 'Expired'}</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                plan.is_featured
                  ? 'bg-gradient-to-br from-orange-500 to-pink-600 shadow-2xl shadow-orange-500/30 scale-105'
                  : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-orange-500/50'
              }`}
            >
              {plan.is_featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-orange-600 px-6 py-1 rounded-full text-sm font-black shadow-lg flex items-center space-x-1">
                  <FiStar size={14} className="fill-current" />
                  <span>MOST POPULAR</span>
                </div>
              )}

              <h3 className={`text-2xl font-black mb-2 ${plan.is_featured ? 'text-white' : 'text-white'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.is_featured ? 'text-white/80' : 'text-gray-400'}`}>
                {plan.description}
              </p>

              <div className="mb-8">
                <span className={`text-5xl font-black ${plan.is_featured ? 'text-white' : 'text-orange-400'}`}>
                  ${plan.price}
                </span>
                <span className={`${plan.is_featured ? 'text-white/70' : 'text-gray-500'}`}>/{getBillingLabel(plan.billing_cycle)}</span>
                {plan.billing_cycle === 'quarterly' && (
                  <p className={`${plan.is_featured ? 'text-white/75' : 'text-gray-400'} text-sm mt-1`}>Lower effective monthly rate over 3 months</p>
                )}
                {plan.billing_cycle === 'yearly' && (
                  <p className={`${plan.is_featured ? 'text-white/75' : 'text-gray-400'} text-sm mt-1`}>Deepest savings with annual billing</p>
                )}
              </div>

              <Link
                to={isAuthenticated ? '/payment' : '/register'}
                state={isAuthenticated ? { plan } : undefined}
                className={`w-full btn mb-8 block text-center ${
                  plan.is_featured
                    ? 'bg-white text-orange-600 hover:bg-gray-100'
                    : 'btn-primary'
                }`}
              >
                {isAuthenticated ? (isActiveSubscription ? 'Change Plan' : 'Upgrade / Renew') : 'Start Free Trial'}
              </Link>

              <ul className="space-y-3">
                <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                    <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                  </div>
                  <span className="text-sm">
                    {plan.max_workouts_per_week === 999 ? 'Unlimited' : `Up to ${plan.max_workouts_per_week}`} workouts/week
                  </span>
                </li>
                {plan.include_meal_plans && (
                  <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                      <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                    </div>
                    <span className="text-sm">Custom meal plans</span>
                  </li>
                )}
                {plan.include_personal_trainer && (
                  <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                      <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                    </div>
                    <span className="text-sm">Personal coach access</span>
                  </li>
                )}
                {plan.include_nutrition_consultation && (
                  <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                      <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                    </div>
                    <span className="text-sm">Nutrition consultation</span>
                  </li>
                )}
                {plan.include_community_access && (
                  <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                      <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                    </div>
                    <span className="text-sm">Community access</span>
                  </li>
                )}
                <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                    <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                  </div>
                  <span className="text-sm">Progress tracking</span>
                </li>
                <li className={`flex items-center space-x-3 ${plan.is_featured ? 'text-white/90' : 'text-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.is_featured ? 'bg-white/20' : 'bg-orange-500/20'}`}>
                    <FiCheck className={`${plan.is_featured ? 'text-white' : 'text-orange-400'}`} size={12} />
                  </div>
                  <span className="text-sm">Mobile app access</span>
                </li>
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-white font-black text-3xl text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes! Cancel your subscription anytime with no penalties or hidden fees.' },
              { q: 'Is there a free trial?', a: 'Absolutely! All plans come with a 7-day free trial. No credit card required.' },
              { q: 'What if I need to pause my subscription?', a: 'You can pause your subscription for up to 3 months at any time.' },
              { q: 'Do you offer refunds?', a: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied.' },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionsPage
