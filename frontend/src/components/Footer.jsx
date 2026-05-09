import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiZap } from 'react-icons/fi'
import { cmsAPI } from '../services/api'

const fallbackSocialLinks = [
  { platform: 'facebook', url: 'https://facebook.com/fitnessproof' },
  { platform: 'twitter', url: 'https://twitter.com/fitnessproof' },
  { platform: 'instagram', url: 'https://instagram.com/fitnessproof' },
  { platform: 'linkedin', url: 'https://linkedin.com' },
  { platform: 'youtube', url: 'https://youtube.com/@fitnessproof' },
]

const socialIconMap = {
  facebook: FiFacebook,
  twitter: FiTwitter,
  instagram: FiInstagram,
  linkedin: FiLinkedin,
  youtube: FiYoutube,
}

const Footer = () => {
  const [footerPages, setFooterPages] = useState([])
  const [socialLinks, setSocialLinks] = useState([])
  const [email, setEmail] = useState('')
  const [subscribeState, setSubscribeState] = useState({ loading: false, message: '', isError: false })

  useEffect(() => {
    const loadFooterContent = async () => {
      try {
        const [pagesRes, socialRes] = await Promise.all([
          cmsAPI.getFooterPages(),
          cmsAPI.getSocialLinks(),
        ])
        setFooterPages(Array.isArray(pagesRes.data) ? pagesRes.data : pagesRes.data?.results || [])
        setSocialLinks(Array.isArray(socialRes.data) ? socialRes.data : socialRes.data?.results || [])
      } catch (error) {
        console.error('Failed to load footer content:', error)
      }
    }
    loadFooterContent()
  }, [])

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribeState({ loading: true, message: '', isError: false })
    try {
      await cmsAPI.subscribeNewsletter(email.trim())
      setSubscribeState({ loading: false, message: 'Subscribed successfully!', isError: false })
      setEmail('')
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Could not subscribe right now.'
      setSubscribeState({ loading: false, message: detail, isError: true })
    }
  }

  const renderedSocialLinks = socialLinks.length > 0 ? socialLinks : fallbackSocialLinks
  const legalSlugs = new Set(['privacy-policy', 'terms-of-service'])
  const extraFooterPages = footerPages.filter((page) => !legalSlugs.has(page.slug))

  return (
    <footer className="bg-gray-950 text-gray-100 border-t border-gray-800">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FiZap className="text-white" size={20} />
              </div>
              <div>
                <span className="font-black text-xl text-white">FitCoach</span>
                <span className="font-black text-xl gradient-text">Pro</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Science-backed fitness coaching for real people. Transform your body and mind with expert guidance.
            </p>
            <div className="flex space-x-3">
              {renderedSocialLinks.map((social, i) => {
                const Icon = socialIconMap[social.platform] || FiZap
                return (
                <a
                  key={`${social.platform}-${i}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all"
                  aria-label={social.platform}
                >
                  <Icon size={16} />
                </a>
              )})}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-bold text-white mb-4">Programs</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link to="/subscriptions" className="hover:text-orange-400 transition">Weight Loss</Link></li>
              <li><Link to="/subscriptions" className="hover:text-orange-400 transition">Muscle Building</Link></li>
              <li><Link to="/subscriptions" className="hover:text-orange-400 transition">Endurance Training</Link></li>
              <li><Link to="/subscriptions" className="hover:text-orange-400 transition">Yoga & Flexibility</Link></li>
              <li><Link to="/subscriptions" className="hover:text-orange-400 transition">HIIT Programs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link to="/pages/about-us" className="hover:text-orange-400 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-orange-400 transition">Our Coaches</Link></li>
              <li><Link to="/blog" className="hover:text-orange-400 transition">Success Stories</Link></li>
              <li><Link to="/blog" className="hover:text-orange-400 transition">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-orange-400 transition">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-white mb-4">Get Free Tips</h4>
            <p className="text-gray-400 text-sm mb-4">Join 5,000+ people getting weekly fitness and nutrition tips.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <button type="submit" disabled={subscribeState.loading} className="btn btn-primary text-sm py-2 disabled:opacity-70">
                {subscribeState.loading ? 'Subscribing...' : 'Subscribe Free'}
              </button>
              {subscribeState.message && (
                <p className={`text-xs ${subscribeState.isError ? 'text-red-300' : 'text-green-300'}`}>
                  {subscribeState.message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <p>&copy; 2024 FitCoachPro. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/pages/privacy-policy" className="hover:text-orange-400 transition">Privacy Policy</Link>
              <Link to="/pages/terms-of-service" className="hover:text-orange-400 transition">Terms of Service</Link>
              {extraFooterPages.map((page) => (
                <Link key={page.id || page.slug} to={`/pages/${page.slug}`} className="hover:text-orange-400 transition">
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
