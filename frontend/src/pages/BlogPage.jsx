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

  const loadBlogData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load categories
      const categoriesRes = await cmsAPI.getBlogCategories()
      setCategories(categoriesRes.data)

      // Load posts based on filters
      let postsData = []
      if (searchQuery) {
        const searchRes = await cmsAPI.searchBlogPosts(searchQuery, selectedCategory)
        postsData = searchRes.data
      } else if (selectedCategory) {
        const categoryRes = await cmsAPI.getBlogPostsByCategory(selectedCategory)
        postsData = categoryRes.data
      } else {
        const allRes = await cmsAPI.getBlogPosts()
        postsData = allRes.data
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
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100">Fitness tips, nutrition advice, and wellness insights</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    selectedCategory === category.slug
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.slug ? category.color : '#e5e7eb',
                    color: selectedCategory === category.slug ? 'white' : '#1f2937',
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {post.featured_image_url && (
                  <div className="w-full h-48 bg-gray-300 overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  {post.category && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-2"
                      style={{ backgroundColor: post.category.color }}
                    >
                      {post.category.name}
                    </span>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{post.author}</span>
                    <span>{new Date(post.published_date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      👁️ {post.views_count} views
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No blog posts found. Try adjusting your filters.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
