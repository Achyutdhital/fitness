import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    height_unit: 'ft_in',
    height_ft: '',
    height_in: '',
    height_cm: '',
    height_m: '',
    weight_unit: 'lb',
    weight: '',
    goal: '',
    activity_level: '',
    dietary_preference: '',
  })

  const [errors, setErrors] = useState({})

  // Check if onboarding was already completed
  useEffect(() => {
    const onboardingData = sessionStorage.getItem('onboarding_data')
    if (onboardingData) {
      navigate('/signup', { state: { onboarding_data: JSON.parse(onboardingData) } })
    }
  }, [navigate])

  const steps = [
    {
      id: 'gender',
      title: "What's your gender?",
      description: 'This helps us personalize your fitness plan',
      type: 'buttons',
      options: [
        { value: 'male', label: '👨 Male' },
        { value: 'female', label: '👩 Female' },
        { value: 'other', label: '🧑 Other' },
      ],
    },
    {
      id: 'age',
      title: 'How old are you?',
      description: 'Age helps with metabolic calculations',
      type: 'number',
      placeholder: 'Enter your age',
      min: 13,
      max: 120,
    },
    {
      id: 'height_ft',
      title: "What's your height?",
      description: 'We need this for body composition analysis',
      type: 'height',
      subtext: 'Feet and inches',
    },
    {
      id: 'weight',
      title: 'What is your current weight?',
      description: 'In pounds (lbs)',
      type: 'number',
      placeholder: 'Enter weight',
      min: 50,
      max: 500,
      unit: 'lbs',
    },
    {
      id: 'goal',
      title: 'What is your main fitness goal?',
      description: 'Your workouts will be tailored accordingly',
      type: 'buttons',
      options: [
        { value: 'lose_weight', label: '⬇️ Lose Weight' },
        { value: 'gain_muscle', label: '⬆️ Gain Muscle' },
        { value: 'maintain', label: '➡️ Maintain' },
        { value: 'improve_health', label: '❤️ Improve Health' },
      ],
    },
    {
      id: 'activity_level',
      title: 'How active are you currently?',
      description: 'This affects your calorie calculations',
      type: 'buttons',
      options: [
        { value: 'sedentary', label: '🛋️ Sedentary' },
        { value: 'lightly_active', label: '🚶 Lightly Active' },
        { value: 'moderately_active', label: '🏃 Moderately Active' },
        { value: 'very_active', label: '💪 Very Active' },
      ],
    },
    {
      id: 'dietary_preference',
      title: 'Any dietary preferences?',
      description: 'For meal pkg recommendations',
      type: 'buttons',
      options: [
        { value: 'omnivore', label: '🍗 Omnivore' },
        { value: 'vegetarian', label: '🥬 Vegetarian' },
        { value: 'vegan', label: '🌱 Vegan' },
        { value: 'keto', label: '🥩 Keto' },
        { value: 'no_preference', label: '✨ No Preference' },
      ],
    },
  ]

  const currentQuestion = steps[currentStep]

  const handleInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
    if (errors[currentQuestion.id]) {
      setErrors(prev => ({ ...prev, [currentQuestion.id]: '' }))
    }
  }

  const handleHeightChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    if (errors.height_ft || errors.height_in) {
      setErrors(prev => ({ ...prev, height_ft: '', height_in: '' }))
    }
  }

  const handleUnitChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = () => {
    const newErrors = {}

    if (currentQuestion.type === 'buttons') {
      if (!formData[currentQuestion.id]) {
        newErrors[currentQuestion.id] = 'Please select an option'
      }
    } else if (currentQuestion.type === 'number') {
      if (!formData[currentQuestion.id]) {
        newErrors[currentQuestion.id] = 'This field is required'
      } else if (currentQuestion.id === 'weight') {
        if (formData.weight_unit === 'lb' && (formData.weight < 50 || formData.weight > 500)) {
          newErrors.weight = 'Please enter weight between 50 and 500 lb'
        } else if (formData.weight_unit === 'kg' && (formData.weight < 20 || formData.weight > 250)) {
          newErrors.weight = 'Please enter weight between 20 and 250 kg'
        }
      } else if (formData[currentQuestion.id] < currentQuestion.min || formData[currentQuestion.id] > currentQuestion.max) {
        newErrors[currentQuestion.id] = `Please enter a value between ${currentQuestion.min} and ${currentQuestion.max}`
      }
    } else if (currentQuestion.type === 'height') {
      if (formData.height_unit === 'ft_in') {
        if (!formData.height_ft || formData.height_in === '') {
          newErrors.height_ft = 'Please enter your height'
        } else if (formData.height_ft < 4 || formData.height_ft > 8 || formData.height_in < 0 || formData.height_in > 11) {
          newErrors.height_ft = 'Please enter a valid height'
        }
      } else if (formData.height_unit === 'cm') {
        if (!formData.height_cm || formData.height_cm < 120 || formData.height_cm > 260) {
          newErrors.height_ft = 'Please enter valid cm height (120-260)'
        }
      } else if (formData.height_unit === 'm') {
        if (!formData.height_m || formData.height_m < 1.2 || formData.height_m > 2.6) {
          newErrors.height_ft = 'Please enter valid meter height (1.2-2.6)'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === steps.length - 1) {
        // All steps completed - save data and redirect to signup
        const dataToSave = { 
          ...formData,
          pkg: location.state?.plan || null
        }
        sessionStorage.setItem('onboarding_data', JSON.stringify(dataToSave))
        navigate('/signup', { state: { onboarding_data: dataToSave, pkg: location.state?.plan } })
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl opacity-20" />

      <div className="relative w-full max-w-2xl z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Let's Get Started</h1>
          <p className="text-slate-400">Just a few quick questions to personalize your fitness journey</p>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-400 ml-2">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
          >
            {/* Question Title */}
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentQuestion.title}
            </h2>
            <p className="text-slate-400 mb-8">{currentQuestion.description}</p>

            {/* Question Content */}
            <div className="mb-8">
              {currentQuestion.type === 'buttons' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleInputChange(option.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl font-semibold transition-all border-2 text-lg ${
                        formData[currentQuestion.id] === option.value
                          ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/50'
                          : 'bg-slate-700/30 border-slate-600 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'number' && (
                <div>
                  {currentQuestion.id === 'weight' && (
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => handleUnitChange('weight_unit', 'lb')} className={`px-3 py-2 rounded-lg text-sm ${formData.weight_unit === 'lb' ? 'bg-orange-500 text-white' : 'bg-slate-700/30 text-slate-300'}`}>lb</button>
                      <button type="button" onClick={() => handleUnitChange('weight_unit', 'kg')} className={`px-3 py-2 rounded-lg text-sm ${formData.weight_unit === 'kg' ? 'bg-orange-500 text-white' : 'bg-slate-700/30 text-slate-300'}`}>kg</button>
                    </div>
                  )}
                  <input
                    type="number"
                    value={formData[currentQuestion.id]}
                    onChange={(e) => handleInputChange(parseInt(e.target.value) || '')}
                    placeholder={currentQuestion.placeholder}
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    className="w-full px-6 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 text-xl font-semibold focus:outline-none focus:border-orange-500 transition-all"
                  />
                  {(currentQuestion.unit || currentQuestion.id === 'weight') && (
                    <p className="text-slate-400 text-sm mt-2">{currentQuestion.id === 'weight' ? formData.weight_unit : currentQuestion.unit}</p>
                  )}
                </div>
              )}

              {currentQuestion.type === 'height' && (
                <div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => handleUnitChange('height_unit', 'ft_in')} className={`px-3 py-2 rounded-lg text-sm ${formData.height_unit === 'ft_in' ? 'bg-orange-500 text-white' : 'bg-slate-700/30 text-slate-300'}`}>ft/in</button>
                    <button type="button" onClick={() => handleUnitChange('height_unit', 'cm')} className={`px-3 py-2 rounded-lg text-sm ${formData.height_unit === 'cm' ? 'bg-orange-500 text-white' : 'bg-slate-700/30 text-slate-300'}`}>cm</button>
                    <button type="button" onClick={() => handleUnitChange('height_unit', 'm')} className={`px-3 py-2 rounded-lg text-sm ${formData.height_unit === 'm' ? 'bg-orange-500 text-white' : 'bg-slate-700/30 text-slate-300'}`}>m</button>
                  </div>
                  {formData.height_unit === 'ft_in' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-300 text-sm font-semibold mb-2 block">Feet</label>
                        <input
                          type="number"
                          value={formData.height_ft}
                          onChange={(e) => handleHeightChange('height_ft', parseInt(e.target.value) || '')}
                          placeholder="5"
                          min="4"
                          max="8"
                          className="w-full px-6 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 text-xl font-semibold focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm font-semibold mb-2 block">Inches</label>
                        <input
                          type="number"
                          value={formData.height_in}
                          onChange={(e) => handleHeightChange('height_in', parseInt(e.target.value) || '')}
                          placeholder="10"
                          min="0"
                          max="11"
                          className="w-full px-6 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 text-xl font-semibold focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  ) : formData.height_unit === 'cm' ? (
                    <input
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => handleHeightChange('height_cm', parseFloat(e.target.value) || '')}
                      placeholder="178"
                      className="w-full px-6 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 text-xl font-semibold focus:outline-none focus:border-orange-500 transition-all"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.height_m}
                      onChange={(e) => handleHeightChange('height_m', parseFloat(e.target.value) || '')}
                      placeholder="1.78"
                      className="w-full px-6 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 text-xl font-semibold focus:outline-none focus:border-orange-500 transition-all"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors[currentQuestion.id] && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {errors[currentQuestion.id]}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              <motion.button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
                whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentStep === 0
                    ? 'bg-slate-700/20 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                <FiChevronLeft size={20} />
                Back
              </motion.button>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/30"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Complete <FiChevronRight size={20} />
                  </>
                ) : (
                  <>
                    Next <FiChevronRight size={20} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
