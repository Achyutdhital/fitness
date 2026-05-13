import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const OAuthCallbackPage = () => {
  const navigate = useNavigate()

  const { accessToken, refreshToken } = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      accessToken: params.get('access'),
      refreshToken: params.get('refresh'),
    }
  }, [])

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      navigate('/signup?oauth_error=missing_tokens', { replace: true })
      return
    }

    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    sessionStorage.removeItem('onboarding_data')

    // Force app auth context to re-hydrate from localStorage.
    window.location.href = '/dashboard'
  }, [accessToken, refreshToken, navigate])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Completing Sign In</h1>
        <p className="text-slate-400">Please wait while we prepare your dashboard...</p>
      </div>
    </div>
  )
}

export default OAuthCallbackPage
