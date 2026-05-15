import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { subscriptionAPI, paymentAPI, coreAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiCheck, FiCreditCard, FiLock, FiStar, FiAlertCircle } from 'react-icons/fi'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

const CheckoutForm = ({ clientSecret, paymentIntentId, isCustom, customPackage, planId, onCancel, onSuccess, amount, packageName }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'FitCoachPro User',
        },
      },
    })

    if (result.error) {
      setError(result.error.message)
      setProcessing(false)
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        try {
          // Call backend to confirm and persist subscription/payment
          if (isCustom) {
            await paymentAPI.confirmPayment(paymentIntentId, { custom_package: customPackage })
          } else {
            await paymentAPI.confirmPayment(paymentIntentId, planId)
          }
          onSuccess()
        } catch (e) {
          setError(e.response?.data?.error || 'Failed to confirm payment on server')
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Card Details</label>
        <div className="py-2">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#64748b',
                  },
                },
                invalid: {
                  color: '#f43f5e',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20">
          <FiAlertCircle />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {processing ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Authorize ${amount}</span>
              <FiCheck />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Change Method
        </button>
      </div>
    </form>
  )
}

const formatCycle = (cycle) => {
  const labels = {
    monthly: 'month',
    quarterly: '3 months',
    yearly: 'year',
  }
  return labels[cycle] || cycle
}

const getTierRank = (tierName) => {
  const rankMap = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'elite': 3,
    'custom': 4,
  }
  return rankMap[tierName?.toLowerCase()] ?? -1
}

const getTierLabel = (tierName, customConfig) => {
  if (tierName?.toLowerCase() === 'custom' && customConfig) {
    return `Custom (${customConfig.sessions_per_week}x${customConfig.session_duration_minutes}min)`
  }
  return tierName || 'Free'
}

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { subscription, fetchUser } = useAuth()
  const [packages, setPackages] = useState([])
  const initialPkgFromState = location.state?.pkg || location.state?.plan || null
  const [selectedPkg, setSelectedPkg] = useState(initialPkgFromState)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentIntent, setPaymentIntent] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState(null)
  const [referral, setReferral] = useState(null)

  const isSubscriptionActive = ['active', 'trial'].includes(subscription?.status) && (!subscription.end_date || new Date(subscription.end_date) > new Date())

  useEffect(() => {
    loadPackages()
    loadReferral()
  }, [])

  const loadPackages = async () => {
    try {
      const response = await subscriptionAPI.getPackages()
      const list = response.data.results || response.data || []
      setPackages(list)
      if (!selectedPkg && list.length > 0) {
        setSelectedPkg(list[0])
      }
    } catch (error) {
      console.error(error)
      setMessage('Unable to load subscription packages')
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

  const currentPkg = useMemo(() => packages.find((pkg) => pkg.id === selectedPkg?.id) || selectedPkg, [packages, selectedPkg])
  const isCustomPkg = Boolean(currentPkg?.is_custom || currentPkg?.custom_config)
  
  // Upgrade path validation
  const upgradeValidation = useMemo(() => {
    const currentTierName = subscription?.tier_details?.name?.toLowerCase()
    const currentTierRank = getTierRank(currentTierName)
    const isCurrentCustom = subscription?.is_custom
    
    if (!isSubscriptionActive || currentTierRank === -1) {
      // No active subscription, allow any purchase
      return { allowed: true, reason: null, warning: null }
    }
    
    // Get new tier rank
    const newTierName = isCustomPkg ? 'custom' : currentPkg?.tier?.name?.toLowerCase() || 'free'
    const newTierRank = getTierRank(newTierName)
    
    // Special case: custom-to-custom is allowed (upgrade sessions/duration)
    if (isCurrentCustom && isCustomPkg) {
      return { allowed: true, reason: 'custom_upgrade', warning: 'You are upgrading your custom package (sessions/duration).' }
    }
    
    // Standard upgrade validation
    if (newTierRank <= currentTierRank) {
      const currentLabel = getTierLabel(currentTierName, subscription?.custom_config)
      const newLabel = getTierLabel(newTierName, currentPkg?.custom_config)
      return {
        allowed: false,
        reason: 'downgrade_blocked',
        warning: `Cannot downgrade from ${currentLabel} to ${newLabel}. You can only upgrade to a higher tier or wait for your current subscription to expire.`
      }
    }
    
    return { allowed: true, reason: 'upgrade_allowed', warning: null }
  }, [subscription, isSubscriptionActive, currentPkg, isCustomPkg])
  
  const discountedAmount = useMemo(() => {
    if (!currentPkg) return 0
    if (!couponStatus?.valid) return Number(currentPkg.price)
    if (couponStatus.discount_type === 'percentage') {
      return Math.max(Number(currentPkg.price) * (1 - Number(couponStatus.discount_value) / 100), 0.5)
    }
    return Math.max(Number(currentPkg.price) - Number(couponStatus.discount_value), 0.5)
  }, [currentPkg, couponStatus])

  const applyCoupon = async () => {
    if (!couponCode || !currentPkg) return
    setMessage('')
    try {
      const couponpackageId = isCustomPkg ? currentPkg.custom_config?.base_plan_id : currentPkg.id
      const response = await coreAPI.validateCoupon(couponCode, couponpackageId)
      setCouponStatus(response.data)
      setMessage('Coupon applied successfully.')
    } catch (error) {
      setCouponStatus(null)
      setMessage(error.response?.data?.error || 'Invalid coupon code.')
    }
  }

  const startPayment = async () => {
    if (!currentPkg) return
    const requestedAmount = Number(discountedAmount)
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setMessage('Invalid payment amount. Please reselect your plan and billing cycle before checkout.')
      return
    }
    setProcessing(true)
    setMessage('')
    try {
      const response = isCustomPkg
        ? await paymentAPI.createPaymentIntent({
            custom_package: currentPkg.custom_config,
            coupon_code: couponStatus?.valid ? couponCode : '',
          })
        : await paymentAPI.createPaymentIntent(currentPkg.id, couponStatus?.valid ? couponCode : '')
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
                <p className="text-sm opacity-80">{isSubscriptionActive ? 'You are currently active. Use this page to switch packages or renew.' : 'Your subscription expired. Renewing here will restore full access.'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Upgrade path validation warning */}
        {isSubscriptionActive && !upgradeValidation.allowed && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 flex items-start gap-3">
            <FiAlertCircle className="mt-1 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">Cannot Proceed: Downgrade Blocked</p>
              <p className="text-sm opacity-90">{upgradeValidation.warning}</p>
            </div>
          </div>
        )}
        
        {/* Custom upgrade info */}
        {upgradeValidation.reason === 'custom_upgrade' && (
          <div className="mb-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-blue-100 flex items-start gap-3">
            <FiCheck className="mt-1 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">Upgrade Your Custom Package</p>
              <p className="text-sm opacity-90">{upgradeValidation.warning}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Selected pkg Hero Card */}
            {currentPkg && (
              <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 md:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] -z-0 rounded-full" />
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-4">
                        <FiStar size={12} />
                        Your Selected Program
                      </div>
                      <h2 className="text-4xl font-black text-white mb-2">{currentPkg.name}</h2>
                      <p className="text-slate-400 text-lg max-w-md">{currentPkg.description}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Billing Cycle</div>
                      <div className="text-3xl font-black text-white">
                        ${Number(currentPkg.price).toFixed(2)}
                        <span className="text-slate-500 text-sm font-bold lowercase tracking-normal">/{formatCycle(currentPkg.billing_cycle)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-10 border-t border-slate-800/50">
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-white font-bold">{currentPkg.duration_days} Days</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                      <p className="text-green-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Ready to Activate
                      </p>
                    </div>
                    {isCustomPkg && currentPkg.custom_config && (
                      <>
                        <div>
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Schedule</p>
                          <p className="text-white font-bold">{currentPkg.custom_config.sessions_per_week} Sessions/Week</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Intensity</p>
                          <p className="text-white font-bold">{currentPkg.custom_config.session_duration_minutes} Min/Session</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-100 text-sm">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!paymentIntent ? (
                <div className="rounded-[2rem] bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-8 shadow-xl col-span-1 md:col-span-2">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-6">
                        <FiCreditCard size={24} />
                      </div>
                      <h3 className="text-white font-black text-xl mb-2">Finalize Payment</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Secure checkout via Stripe</p>
                      <button
                        onClick={startPayment}
                        disabled={!currentPkg || processing || Number(discountedAmount) <= 0 || (isSubscriptionActive && !upgradeValidation.allowed)}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-2xl py-4 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {processing ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Initialize Payment</span>
                            <FiLock size={12} />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="hidden md:block w-px h-32 bg-slate-800/50" />

                    <div className="flex-1">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6">
                        <FiStar size={24} />
                      </div>
                      <h3 className="text-white font-black text-xl mb-2">Promo Code</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Apply your discount</p>
                      <div className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="CODE"
                          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-orange-500 transition-all"
                        />
                        <button 
                          onClick={applyCoupon} 
                          className="bg-slate-800 hover:bg-slate-700 text-white px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                          disabled={!couponCode || !currentPkg}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                  {couponStatus?.valid && (
                    <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <FiCheck />
                      Benefit: {couponStatus.discount_type === 'percentage' ? `${couponStatus.discount_value}% Discount` : `$${couponStatus.discount_value} Credit`}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[2.5rem] bg-slate-900 border border-orange-500/30 p-8 shadow-2xl col-span-1 md:col-span-2">
                  <div className="mb-8">
                    <h3 className="text-white font-black text-2xl mb-2">Enter Payment Details</h3>
                    <p className="text-slate-500 text-sm">Please provide your card information to complete the activation of {currentPkg.name}.</p>
                  </div>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm 
                      clientSecret={paymentIntent.client_secret}
                      paymentIntentId={paymentIntent.payment_intent_id}
                      amount={discountedAmount.toFixed(2)}
                      packageName={currentPkg.name}
                      isCustom={isCustomPkg}
                      customPackage={currentPkg.custom_config}
                      planId={currentPkg.id}
                      onCancel={() => setPaymentIntent(null)}
                      onSuccess={async () => {
                        setMessage('Payment successful! Your subscription is now active.')
                        setPaymentIntent(null)
                        // Refresh user and subscription state
                        await fetchUser()
                        // Navigate to dashboard after a delay
                        setTimeout(() => navigate('/dashboard'), 2000)
                      }}
                    />
                  </Elements>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
              <h2 className="text-white font-bold text-xl mb-4">Order Summary</h2>
              {currentPkg ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">package</span>
                    <span className="text-white font-semibold">{currentPkg.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Billing</span>
                    <span className="text-white font-semibold">/{formatCycle(currentPkg.billing_cycle)}</span>
                  </div>
                  {isCustomPkg && currentPkg.custom_config && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400">Sessions / week</span>
                        <span className="text-white font-semibold">{currentPkg.custom_config.sessions_per_week}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400">Session length</span>
                        <span className="text-white font-semibold">{currentPkg.custom_config.session_duration_minutes} min</span>
                      </div>
                      <div className="flex items-center justify-between mb-3 border-t border-gray-800 pt-3">
                        <span className="text-gray-400">Total Coaching Time</span>
                        <span className="text-white font-semibold text-right">
                          {(() => {
                            const cycle = currentPkg.billing_cycle || 'monthly'
                            const weeks = cycle === 'monthly' ? 4 : (cycle === 'quarterly' ? 13 : 52)
                            const totalMins = currentPkg.custom_config.sessions_per_week * currentPkg.custom_config.session_duration_minutes * weeks
                            const hrs = Math.floor(totalMins / 60)
                            const mins = totalMins % 60
                            return `${hrs}h ${mins > 0 ? mins + 'm' : ''} / ${formatCycle(cycle)}`
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400">Coaching Charge</span>
                        <span className="text-white font-semibold text-orange-400">${Number(currentPkg.custom_config.billing_cycle_addon || currentPkg.custom_config.monthly_addon || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white font-semibold">${Number(currentPkg.price).toFixed(2)}</span>
                  </div>
                  {couponStatus?.valid && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Discounted</span>
                      <span className="text-green-300 font-semibold">${discountedAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-semibold">{currentPkg.duration_days} days</span>
                  </div>
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <p className="text-gray-400 text-sm mb-2">Included</p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {currentPkg.include_meal_packages && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Meal packages</li>}
                      {currentPkg.include_personal_trainer && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Personal trainer access</li>}
                      {currentPkg.include_nutrition_consultation && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Nutrition consultation</li>}
                      {currentPkg.include_community_access && <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Community access</li>}
                      <li className="flex items-center gap-2"><FiCheck className="text-green-400" />Workout tracking</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No pkg selected.</p>
              )}
            </div>

            {paymentIntent && (
              <div className="rounded-3xl bg-gray-900/80 border border-gray-700 p-6">
                <h2 className="text-white font-bold text-xl mb-4">Payment Intent</h2>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><span className="text-gray-500">pkg:</span> {paymentIntent.package}</p>
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
            Back to subscription packages
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
