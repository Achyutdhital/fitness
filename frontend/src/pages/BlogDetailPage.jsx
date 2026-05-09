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
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/blog" className="text-blue-600 hover:text-blue-800 font-semibold">
            ← Back to Blog
          </Link>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="w-full h-96 bg-gray-300 overflow-hidden">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white my-8 rounded-lg shadow">
        {/* Header */}
        <div className="mb-8">
          {post.category && (
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white mb-4"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </span>
          )}

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6 pb-6 border-b">
            <span className="font-semibold">{post.author}</span>
            <span>•</span>
            <span>{new Date(post.published_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
            <span>•</span>
            <span>👁️ {post.views_count} views</span>
          </div>
        </div>

        {/* Tags */}
        {post.tags && (
          <div className="mb-8 pb-8 border-b">
            <div className="flex flex-wrap gap-2">
              {post.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Share & Info */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Share this article</h3>
          <div className="flex gap-4">
            <a
              href={`https://facebook.com/sharer/sharer.php?u=${window.location.href}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=${post.title}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-600"
            >
              Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:text-blue-900"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relPost) => (
              <Link
                key={relPost.id}
                to={`/blog/${relPost.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {relPost.featured_image_url && (
                  <div className="w-full h-48 bg-gray-300 overflow-hidden">
                    <img
                      src={relPost.featured_image_url}
                      alt={relPost.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">
                    {relPost.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {relPost.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
