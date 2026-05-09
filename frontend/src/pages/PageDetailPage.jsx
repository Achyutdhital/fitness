import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cmsAPI } from '../services/api'

const PageDetailPage = () => {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await cmsAPI.getPageDetail(slug)
        setPage(response.data)
      } catch (err) {
        console.error('Failed to load page:', err)
        setError('Page could not be loaded')
      } finally {
        setLoading(false)
      }
    }
    loadPage()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error || 'Page not found'}
          </div>
          <Link to="/" className="text-orange-600 hover:text-orange-700 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow px-6 md:px-10 py-10">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">{page.title}</h1>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{page.content}</div>
      </article>
    </div>
  )
}

export default PageDetailPage
