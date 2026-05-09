import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { subscriptionAPI, paymentAPI, coreAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiCheck, FiCreditCard, FiLock, FiStar } from 'react-icons/fi'

const formatCycle = (cycle) => {
  const labels = {
    monthly: 'month',
    quarterly: '3 months',
    yearly: 'year',
  }
  return labels[cycle] || cycle
}

const PaymentPage = () => {
  const location = useLocation()
  const { subscription } = useAuth()
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(location.state?.plan || null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentIntent, setPaymentIntent] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState(null)
  const [referral, setReferral] = useState(null)

  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())

  useEffect(() => {
    loadPlans()
    loadReferral()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans()
      const list = response.data.results || response.data || []
      setPlans(list)
      if (!selectedPlan && list.length > 0) {
        setSelectedPlan(list[0])
      }
    } catch (error) {
      console.error(error)
      setMessage('Unable to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const loadReferral = async () => {
    try {
      const response = await coreAPI.getMyReferral()
      setReferral(response.data)
    } catch (error) {
      setReferral(null)
    }
  }

  const currentPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlan?.id) || selectedPlan, [plans, selectedPlan])
  const discountedAmount = useMemo(() => {
    if (!currentPlan) return 0
    if (!couponStatus?.valid) return Number(currentPlan.price)
    if (couponStatus.discount_type === 'percentage') {
      return Math.max(Number(currentPlan.price) * (1 - Number(couponStatus.discount_value) / 100), 0.5)
    }
    return Math.max(Number(currentPlan.price) - Number(couponStatus.discount_value), 0.5)
  }, [currentPlan, couponStatus])

  const applyCoupon = async () => {
    if (!couponCode || !currentPlan) return
    setMessage('')
    try {
      const response = await coreAPI.validateCoupon(couponCode, currentPlan.id)
      setCouponStatus(response.data)
      setMessage('Coupon applied successfully.')
    } catch (error) {
      setCouponStatus(null)
      setMessage(error.response?.data?.error || 'Invalid coupon code.')
    }
  }

  const startPayment = async () => {
    if (!currentPlan) return
    setProcessing(true)
    setMessage('')
    try {
      const response = await paymentAPI.createPaymentIntent(currentPlan.id, couponStatus?.valid ? couponCode : '')
      setPaymentIntent(response.data)
      setMessage('Payment intent created. Complete your Stripe checkout to finalize the subscription.')
    } catch (error) {
      console.error(error)
      setMessage(error.response?.data?.error || 'Payment could not be started. Please check Stripe configuration.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Checkout</h1>
          <p className="text-gray-400 text-lg">Finish your subscription and unlock premium workouts, nutrition, and saved progress.</p>
        </div>

        {subscription?.subscription_plan && (
          <div className={`mb-8 rounded-2xl border p-5 ${isSubscriptionActive ? 'border-green-500/30 bg-green-500/10 text-green-100' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100'}`}>
            <div className="flex items-start gap-3">
              {isSubscriptionActive ? <FiCheck className="mt-1" /> : <FiLock className="mt-1" />}
              <div>
                <p className="font-bold mb-1">Current subscription: {subscription.subscription_plan.name}</p>
                <p className="text-sm opacity-80">{isSubscriptionActive ? 'You are currently active. Use this page to switch plans or renew.' : 'Your subscription expired. Renewing here will restore full access.'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-2xl mb-4">Select a Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`rounded-2xl border p-5 text-left transition-all ${currentPlan?.id === plan.id ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-800/60 hover:border-orange-500/40'}`}
                  >
                    {plan.is_featured && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-200 mb-3">
                        <FiStar size={12} />
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-black text-orange-400">${plan.price}</span>
                      <span className="text-gray-500">/{formatCycle(plan.billing_cycle)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-100 text-sm">
                {message}
              </div>
            )}

            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-2xl mb-4">Payment Action</h2>
              <p className="text-gray-400 text-sm mb-4">
                This page creates a payment intent from the backend. Connect a Stripe card form here for live card entry, or use the API response below for the next integration step.
              </p>
              <button
                onClick={startPayment}
                disabled={!currentPlan || processing}
                className="btn btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <FiCreditCard size={16} />
                <span>{processing ? 'Starting payment...' : 'Start Payment'}</span>
              </button>
            </div>
            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-2xl mb-4">Coupon</h2>
              <div className="flex gap-3">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="input-field bg-gray-800 text-white border-gray-700"
                />
                <button onClick={applyCoupon} className="btn btn-primary" disabled={!couponCode || !currentPlan}>
                  Apply
                </button>
              </div>
              {couponStatus?.valid && (
                <p className="text-green-300 text-sm mt-3">
                  Applied: {couponStatus.discount_type === 'percentage' ? `${couponStatus.discount_value}% off` : `$${couponStatus.discount_value} off`}
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-xl mb-4">Order Summary</h2>
              {currentPlan ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Plan</span>
                    <span className="text-white font-semibold">{currentPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Billing</span>
                    <span className="text-white font-semibold">/{formatCycle(currentPlan.billing_cycle)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white font-semibold">${Number(currentPlan.price).toFixed(2)}</span>
                  </div>
                  {couponStatus?.valid && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Discounted</span>
                      <span className="text-green-300 font-semibold">${discountedAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{currentPlan.duration_days} days</span>
                  </div>
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <p className="text-gray-400 text-sm mb-2">Included</p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {currentPlan.include_meal_plans && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Meal plans</li>}
                      {currentPlan.include_personal_trainer && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Personal trainer access</li>}
                      {currentPlan.include_nutrition_consultation && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Nutrition consultation</li>}
                      {currentPlan.include_community_access && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Community access</li>}
                      <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Workout tracking</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No plan selected.</p>
              )}
            </div>

            {paymentIntent && (
              <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
                <h2 className="text-white font-bold text-xl mb-4">Payment Intent</h2>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><span className="text-gray-500">Plan:</span> {paymentIntent.plan}</p>
                  <p><span className="text-gray-500">Amount:</span> ${paymentIntent.amount} {paymentIntent.currency}</p>
                  {paymentIntent.original_amount && paymentIntent.original_amount !== paymentIntent.amount && (
                    <p><span className="text-gray-500">Original:</span> ${paymentIntent.original_amount}</p>
                  )}
                  <p className="break-all"><span className="text-gray-500">Client Secret:</span> {paymentIntent.client_secret}</p>
                </div>
              </div>
            )}
            {referral && (
              <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
                <h2 className="text-white font-bold text-xl mb-3">Your Referral</h2>
                <p className="text-gray-300 text-sm mb-2">Code: <span className="font-bold text-orange-300">{referral.referral_code}</span></p>
                <p className="text-gray-400 text-xs break-all">{referral.referral_link}</p>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-10 text-center">
          <Link to="/subscriptions" className="text-orange-400 hover:text-orange-300 text-sm font-semibold">
            Back to subscription plans
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
