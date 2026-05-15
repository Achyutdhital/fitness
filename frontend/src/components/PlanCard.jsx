import React from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiVideo, FiStar, FiClock, FiZap, FiCheckCircle, FiTarget } from 'react-icons/fi'

const getTierIcon = (name) => {
  switch (name.toLowerCase()) {
    case 'free': return <FiClock size={24} className="text-blue-400" />
    case 'pro': return <FiStar size={24} className="text-purple-400" />
    case 'elite': return <FiZap size={24} className="text-orange-400" />
    case 'custom': return <FiTarget size={24} className="text-emerald-400" />
    default: return <FiCheckCircle size={24} className="text-green-400" />
  }
}

export default function PlanCard({ tier, plan, pkg, billingCycle, idx, currentTierName, currentTierIndex, isAuthenticated, isInRenewalWindow, customContent, userIsCustom }) {
  const planData = plan || pkg
  const isCustom = tier.name.toLowerCase() === 'custom' || planData?.is_custom
  const isFree = tier.name.toLowerCase() === 'free'
  const isPopular = tier.name.toLowerCase() === 'pro'
  const isCurrent = tier.name.toLowerCase() === currentTierName
  const isCustomCurrent = Boolean(isAuthenticated && userIsCustom && isCustom)
  const showCurrentState = isCurrent || isCustomCurrent

  let buttonText = isCustom ? 'Continue to Checkout' : 'Subscribe'
  let buttonLink = isAuthenticated ? '/payment' : '/onboarding'
  let isIncluded = false
  let isLocked = false
  let badgeText = null
  let badgeColor = null

  if (isAuthenticated) {
    if (showCurrentState && !isCustomCurrent) {
      badgeText = 'CURRENT PLAN'
      badgeColor = 'bg-green-500/20 text-green-400 border-green-500/30'
      if (isInRenewalWindow) {
        buttonText = 'Renew Now'
      } else {
        buttonText = 'Current Plan'
        isLocked = true
        buttonLink = '/dashboard'
      }
    } else if (!isCustom && idx > currentTierIndex) {
      badgeText = 'AVAILABLE UPGRADE'
      badgeColor = 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      buttonText = 'Upgrade'
    } else if (!isCustom && idx < currentTierIndex) {
      badgeText = 'INCLUDED IN YOUR PLAN'
      badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      buttonText = 'Included'
      isIncluded = true
      buttonLink = '/dashboard'
    }
    if (isCustomCurrent) {
      badgeText = 'CURRENT PLAN'
      badgeColor = 'bg-green-500/20 text-green-400 border-green-500/30'
      buttonText = 'Current Plan'
      isLocked = true
      buttonLink = '/profile/subscriptions'
    }
  } else {
    if (isCustom) {
    buttonText = 'Build Your Plan'
    } else if (isFree) {
      buttonText = 'Initialize'
    } else {
      buttonText = 'Subscribe'
    }
  }

  return (
    <div
      key={tier.id}
      className={`relative rounded-[2.5rem] p-8 transition-all duration-500 group ${
        isPopular
          ? 'bg-slate-900 border-2 border-orange-500 shadow-2xl shadow-orange-500/10'
          : 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-orange-500/30'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest">
          MOST POPULAR
        </div>
      )}
      
      {badgeText && (
        <div className={`absolute -top-4 right-4 px-4 py-1 rounded-full text-[10px] font-black tracking-widest border ${badgeColor}`}>
          {badgeText}
        </div>
      )}

      <div className="flex items-center space-x-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50 shadow-inner group-hover:bg-orange-500/10 transition-colors duration-500">
          {getTierIcon(tier.name)}
        </div>
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">{tier.name}</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {typeof idx === 'number' && idx >= 0 ? `Tier ${idx + 1}` : (isCustom ? 'Custom' : '')}
          </span>
        </div>
      </div>

      <div className="mb-10">
        {isFree ? (
          <div className="flex flex-col">
            <span className="text-5xl font-black text-white">FREE</span>
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
              <FiVideo size={14} /> AD-SUPPORTED
            </span>
          </div>
        ) : (
          <div>
            {showCurrentState ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-green-400 uppercase tracking-widest">CURRENT PLAN</span>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">
                  Current billing cycle: {billingCycle}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">
                    ${planData ? Number(planData.price).toFixed(2) : '—'}
                  </span>
                  <span className="text-slate-500 text-xs font-black uppercase tracking-widest">
                    /{billingCycle === 'monthly' ? 'mo' : billingCycle === 'quarterly' ? '3mo' : 'yr'}
                  </span>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Billed {billingCycle}</p>
              </>
            )}
            {tier.video_sessions_per_month ? (
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-2">
                {tier.video_sessions_per_month} one-on-one class{tier.video_sessions_per_month > 1 ? 'es' : ''} / month
              </p>
            ) : null}
          </div>
        )}
      </div>

      {customContent ? (
        <div className="mt-10 pt-8 border-t border-slate-800/50">
          {customContent}
        </div>
      ) : (
        <>
          {showCurrentState || isIncluded || isLocked ? (
            <div className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-center block transition-all ${
              showCurrentState || isIncluded 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}>
              {buttonText}
            </div>
          ) : (
            <Link
              to={buttonLink}
              state={!isFree && planData ? { pkg: planData } : undefined}
              className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-center block transition-all ${
                isFree 
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : isPopular
                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02]'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {buttonText}
            </Link>
          )}

          <div className="mt-10 pt-8 border-t border-slate-800/50">
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-6">Inclusions</p>
            <ul className="space-y-4">
              {tier.features.map((feature, i) => {
                const isNo = feature.startsWith('❌')
                const text = feature.replace(/^[✅❌]\s*/, '')
                return (
                  <li key={i} className={`flex items-start space-x-3 ${isNo ? 'opacity-30' : ''}`}>
                    {isNo
                      ? <span className="text-red-500 mt-1 flex-shrink-0 text-xs">✗</span>
                      : <FiCheck className="text-orange-500 mt-1 flex-shrink-0" size={14} />
                    }
                    <span className={`text-xs font-bold leading-relaxed ${isNo ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                      {text}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
