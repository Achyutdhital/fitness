import React, { useState, useEffect } from 'react'
import { coreAPI } from '../services/api'
import { FiVideo, FiX, FiZap, FiAward, FiCheckCircle } from 'react-icons/fi'

const AdRewardModal = ({ isOpen, onClose, onReward }) => {
  const [step, setStep] = useState('intro') // intro, watching, completed
  const [timeLeft, setTimeLeft] = useState(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let timer
    if (step === 'watching' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (step === 'watching' && timeLeft === 0) {
      setStep('completed')
    }
    return () => clearInterval(timer)
  }, [step, timeLeft])

  const startWatching = () => {
    setStep('watching')
    setTimeLeft(15) // Shorter for demo purposes, usually 30
  }

  const handleClaim = async () => {
    setLoading(true)
    try {
      const response = await coreAPI.logAdView()
      if (onReward) onReward(response.data)
      onClose()
    } catch (error) {
      console.error('Failed to claim points:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" onClick={step !== 'watching' ? onClose : undefined}></div>
      
      <div className="relative bg-gray-800 border border-gray-700 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        {step !== 'watching' && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        )}

        <div className="p-8 pt-12 text-center">
          {step === 'intro' && (
            <>
              <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] flex items-center justify-center text-blue-400 mx-auto mb-6">
                <FiVideo size={40} />
              </div>
              <h2 className="text-2xl font-black text-white mb-4">Watch & Earn Points</h2>
              <p className="text-gray-400 mb-2">
                Watch a short 15-second ad to earn <span className="text-white font-bold">+25 points</span>.
              </p>
              <div className="flex flex-col gap-2 mb-8 text-left bg-gray-900/50 rounded-2xl p-4">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">What points unlock</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preview 1 workout session</span>
                  <span className="text-blue-400 font-black">50 pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preview 1 meal from a plan</span>
                  <span className="text-blue-400 font-black">50 pts</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-800 pt-2 mt-1">
                  <span className="text-gray-500 text-xs italic">Full programs & progressions</span>
                  <span className="text-orange-400 font-black text-xs">Basic+</span>
                </div>
              </div>
              <button 
                onClick={startWatching}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center space-x-2"
              >
                <FiZap />
                <span>Start Video</span>
              </button>
            </>
          )}

          {step === 'watching' && (
            <>
              <div className="aspect-video bg-gray-900 rounded-3xl mb-8 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Simulated Google Ad Content */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 animate-pulse"></div>
                <div className="z-10 text-center p-6">
                  <div className="text-blue-400 font-black text-xs uppercase tracking-widest mb-2">Google Ads</div>
                  <h3 className="text-white font-bold text-lg mb-1">FitCoachPro Premium</h3>
                  <p className="text-gray-400 text-xs">Unlock your full potential with Elite coaching.</p>
                </div>
                
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1.5 bg-gray-700 w-full">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${((15 - timeLeft) / 15) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900/50 rounded-full text-gray-400 text-sm font-bold">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                <span>Reward in {timeLeft}s...</span>
              </div>
            </>
          )}

          {step === 'completed' && (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-[2rem] flex items-center justify-center text-green-400 mx-auto mb-6 scale-up">
                <FiAward size={40} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">+25 Points Earned!</h2>
              <p className="text-gray-400 mb-8">
                Ad complete! You earned 25 points. At 50 pts you can preview a single session from any plan. Full progressive programs need a <span className="text-orange-400 font-bold">Basic subscription</span>.
              </p>
              <button 
                onClick={handleClaim}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiCheckCircle />
                    <span>Claim 25 Points</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdRewardModal
