import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiMenu, FiX, FiLogOut, FiUser, FiZap, FiShield, FiBell, FiChevronDown } from 'react-icons/fi'
import { coreAPI } from '../services/api'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      coreAPI.getUnreadCount().then(r => setUnreadCount(r.data.unread_count)).catch(() => {})
    }
  }, [isAuthenticated, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsOpen(false)
    setUserMenuOpen(false)
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setIsOpen(false)}
      className={`text-sm font-medium transition-colors ${
        location.pathname === to ? 'text-orange-400' : 'text-gray-300 hover:text-orange-400'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md shadow-xl border-b border-gray-800 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <FiZap className="text-white" size={18} />
          </div>
          <span className="font-black text-lg text-white hidden sm:block">
            FitCoach<span className="gradient-text">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          {navLink('/subscriptions', 'Programs')}
          {isAuthenticated && (
            <>
              {navLink('/workouts', 'Workouts')}
              {navLink('/meal-plans', 'Nutrition')}
              {navLink('/challenges', 'Challenges')}
              {navLink('/dashboard', 'Dashboard')}
            </>
          )}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-orange-400 transition-colors">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-300 hover:bg-gray-800 transition"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user?.first_name || user?.username}</span>
                  <FiChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-white font-semibold text-sm">{user?.first_name} {user?.last_name}</p>
                      <p className="text-gray-400 text-xs">{user?.email}</p>
                    </div>
                    {[
                      { to: '/profile', label: '👤 My Profile' },
                      { to: '/achievements', label: '🏆 Achievements' },
                      { to: '/measurements', label: '📊 Measurements' },
                      { to: '/subscriptions', label: '💳 Upgrade Plan' },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                      >
                        {item.label}
                      </Link>
                    ))}
                    {(user?.is_staff || user?.is_superuser) && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-orange-400 hover:bg-gray-700 transition-colors text-sm border-t border-gray-700"
                      >
                        <FiShield size={14} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-red-400 hover:bg-gray-700 transition-colors text-sm border-t border-gray-700"
                    >
                      <FiLogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-orange-400 transition text-sm font-medium">Login</Link>
              <Link to="/register" className="btn btn-primary text-sm py-2 px-5">Start Free Trial</Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white p-1" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="container py-4 space-y-3">
            {navLink('/subscriptions', 'Programs')}
            {isAuthenticated && (
              <>
                {navLink('/workouts', 'Workouts')}
                {navLink('/meal-plans', 'Nutrition')}
                {navLink('/challenges', 'Challenges')}
                {navLink('/achievements', 'Achievements')}
                {navLink('/measurements', 'Measurements')}
                {navLink('/dashboard', 'Dashboard')}
                {navLink('/profile', 'Profile')}
                {(user?.is_staff || user?.is_superuser) && navLink('/admin', '⚙️ Admin')}
                <button onClick={handleLogout} className="block w-full text-left text-red-400 text-sm font-medium pt-2 border-t border-gray-800">
                  Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                {navLink('/login', 'Login')}
                <Link to="/register" className="block btn btn-primary text-center text-sm" onClick={() => setIsOpen(false)}>
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
