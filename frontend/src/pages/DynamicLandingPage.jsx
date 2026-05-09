import React, { useState, useEffect } from 'react'
import api from '../services/api'
import SectionRenderer from '../components/SectionRenderer'

/**
 * Dynamic Landing Page Component
 * Fetches all page sections from the backend API and renders them dynamically
 * No hardcoded content - everything is managed through the admin panel
 */
const DynamicLandingPage = () => {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.cmsApi.getSectionsByPage('home')
      setSections(response.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load page sections')
      console.error('Error fetching sections:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-4">Error Loading Page</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchSections}
            className="btn btn-primary px-6 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">Page Not Configured</h2>
          <p className="text-gray-600">This page has no sections configured yet. Please check back soon or contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  )
}

export default DynamicLandingPage
