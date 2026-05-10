import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cmsAPI } from '../services/api'

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBlogData()
  }, [selectedCategory, searchQuery])

  // Helper: backend returns paginated {count, results:[...]} OR a plain array
  const extractList = (data) => Array.isArray(data) ? data : (data?.results || [])

  const loadBlogData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load categories
      const categoriesRes = await cmsAPI.getBlogCategories()
      setCategories(extractList(categoriesRes.data))

      // Load posts based on active filters
      let postsData = []
      if (searchQuery) {
        const searchRes = await cmsAPI.searchBlogPosts(searchQuery, selectedCategory)
        postsData = extractList(searchRes.data)
      } else if (selectedCategory) {
        const categoryRes = await cmsAPI.getBlogPostsByCategory(selectedCategory)
        postsData = extractList(categoryRes.data)
      } else {
        const allRes = await cmsAPI.getBlogPosts()
        postsData = extractList(allRes.data)
      }

      setPosts(postsData)
    } catch (err) {
      setError('Failed to load blog posts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug === selectedCategory ? '' : slug)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12">
      {/* Header Hero */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 py-20 mb-12">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-widest rounded-full mb-4">
            Insights & Wisdom
          </span>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Elite</span> Journal
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Science-backed fitness protocols, nutrition blueprints, and professional performance strategies for the modern athlete.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Filters Row */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search the archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white px-6 py-4 rounded-2xl shadow-xl focus:ring-2 focus:ring-orange-500/50 focus:border-transparent outline-none transition-all placeholder-slate-500"
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  selectedCategory === ''
                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                All Archive
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    selectedCategory === category.slug
                      ? 'text-white shadow-lg shadow-orange-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.slug ? category.color : undefined,
                    opacity: selectedCategory === category.slug ? 1 : 0.8
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-slate-500 font-medium">Decoding archive...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden hover:bg-slate-800/80 hover:border-orange-500/30 transition-all duration-500 flex flex-col"
              >
                {post.featured_image_url && (
                  <div className="relative w-full h-56 bg-slate-700 overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                    {post.category && (
                      <span
                        className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white"
                        style={{ backgroundColor: post.category.color }}
                      >
                        {post.category.name}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 leading-tight group-hover:text-orange-400 transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  
                  <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">
                        {post.author?.[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">{post.author}</span>
                        <span className="text-[10px] text-slate-500">{new Date(post.published_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-orange-500 group-hover:translate-x-2 transition-transform">
                      Read Entry →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-24 bg-slate-800/20 rounded-[3rem] border border-slate-800 border-dashed">
              <p className="text-slate-500 text-lg">No entries found matching your criteria.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
