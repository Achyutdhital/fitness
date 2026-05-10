import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { cmsAPI } from '../services/api'

export default function BlogDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBlogPost()
  }, [slug])

  const loadBlogPost = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch post details
      const postRes = await cmsAPI.getBlogPostDetail(slug)
      setPost(postRes.data)

      // Increment views
      await cmsAPI.incrementBlogViews(slug)

      // Load related posts from same category
      if (postRes.data.category) {
        const relatedRes = await cmsAPI.getBlogPostsByCategory(postRes.data.category.slug)
        setRelatedPosts(relatedRes.data.filter(p => p.id !== postRes.data.id).slice(0, 3))
      }
    } catch (err) {
      setError('Failed to load blog post')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error || 'Blog post not found'}
          </div>
          <Link to="/blog" className="text-blue-600 hover:text-blue-800 font-semibold">
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] bg-slate-900 overflow-hidden">
        {post.featured_image_url ? (
          <>
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-orange-950/20 to-slate-900" />
        )}
        
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <Link to="/blog" className="inline-flex items-center space-x-2 text-orange-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8 hover:text-orange-300 transition-colors">
              <span>← Back to Archive</span>
            </Link>
            
            {post.category && (
              <span
                className="inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white mb-6"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </span>
            )}
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center space-x-6 text-slate-400">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300 border border-slate-700">
                    {post.author?.[0]}
                  </div>
                  <span className="text-sm font-bold text-slate-300">{post.author}</span>
               </div>
               <span className="w-1 h-1 bg-slate-700 rounded-full" />
               <span className="text-sm font-medium">{new Date(post.published_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
               <span className="w-1 h-1 bg-slate-700 rounded-full" />
               <span className="text-sm font-medium">👁️ {post.views_count} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-24">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800/50 rounded-[3rem] p-8 md:p-16 shadow-2xl">
          {/* Tags */}
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="px-4 py-1.5 bg-slate-800/80 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-700/50"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-invert prose-orange max-w-none">
            <div className="text-lg md:text-xl leading-[1.8] text-slate-300 whitespace-pre-wrap font-medium">
              {post.content}
            </div>
          </div>

          {/* Share Section */}
          <div className="mt-20 pt-12 border-t border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2">Spread the Wisdom</h3>
              <p className="text-slate-500 text-sm">Help others unlock their elite potential.</p>
            </div>
            <div className="flex gap-3">
              {[
                { name: 'Facebook', url: `https://facebook.com/sharer/sharer.php?u=${window.location.href}`, color: 'hover:bg-blue-600' },
                { name: 'X', url: `https://twitter.com/intent/tweet?url=${window.location.href}`, color: 'hover:bg-slate-700' },
                { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`, color: 'hover:bg-blue-700' }
              ].map(social => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-6 py-3 bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 transition-all ${social.color} hover:text-white border border-slate-700/50`}
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl font-black text-white mb-12 flex items-center space-x-4">
               <span className="w-12 h-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
               <span>Continue Reading</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relPost) => (
                <Link
                  key={relPost.id}
                  to={`/blog/${relPost.slug}`}
                  className="group bg-slate-900/40 border border-slate-800/50 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all duration-500 flex flex-col"
                >
                  {relPost.featured_image_url && (
                    <div className="w-full h-40 bg-slate-800 overflow-hidden relative">
                      <img
                        src={relPost.featured_image_url}
                        alt={relPost.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-white font-black mb-2 line-clamp-2 leading-tight group-hover:text-orange-400 transition-colors">
                      {relPost.title}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {relPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
