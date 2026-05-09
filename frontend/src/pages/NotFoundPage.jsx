import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-2xl mb-8">Page Not Found</p>
        <p className="text-gray-300 mb-8">Sorry, the page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary inline-flex items-center space-x-2">
          <FiArrowLeft />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
