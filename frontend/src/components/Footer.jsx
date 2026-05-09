import React from 'react'
import { Link } from 'react-router-dom'
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiZap } from 'react-icons/fi'

const Footer = () => {
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
              {[FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                  <Icon size={16} />
                </a>
              ))}
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
              <li><a href="#" className="hover:text-orange-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-orange-400 transition">Our Coaches</a></li>
              <li><a href="#" className="hover:text-orange-400 transition">Success Stories</a></li>
              <li><a href="#" className="hover:text-orange-400 transition">Blog</a></li>
              <li><Link to="/contact" className="hover:text-orange-400 transition">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-white mb-4">Get Free Tips</h4>
            <p className="text-gray-400 text-sm mb-4">Join 5,000+ people getting weekly fitness and nutrition tips.</p>
            <div className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <button className="btn btn-primary text-sm py-2">
                Subscribe Free
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <p>&copy; 2024 FitCoachPro. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-orange-400 transition">Privacy Policy</a>
              <a href="#" className="hover:text-orange-400 transition">Terms of Service</a>
              <a href="#" className="hover:text-orange-400 transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
