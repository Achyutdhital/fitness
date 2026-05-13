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
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#0f172a] py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl mb-8 font-medium">
            {error || 'Page not found'}
          </div>
          <Link to="/" className="text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10" />
      
      <article className="max-w-4xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-[3rem] p-10 md:p-16 shadow-2xl relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-10 tracking-tight">{page.title}</h1>
        <div className="prose prose-invert prose-orange max-w-none">
          <div className="text-lg leading-[1.8] text-slate-300 whitespace-pre-wrap font-medium">
            {page.content}
          </div>
        </div>
      </article>
    </div>
  )
}

export default PageDetailPage
