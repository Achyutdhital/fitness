import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FiGrid, FiFileText, FiSettings, FiUsers, FiMessageSquare,
  FiImage, FiLayers, FiDollarSign, FiActivity, FiAward,
  FiMail, FiTag, FiChevronRight, FiMenu, FiX, FiShield,
  FiZap, FiBarChart2, FiCalendar, FiTarget
} from 'react-icons/fi'

import AdminOverview from './AdminOverview'
import AdminWorkouts from './AdminWorkouts'
import AdminMealPlans from './AdminMealPlans'
import AdminBlog from './AdminBlog'
import AdminPages from './AdminPages'
import AdminSubscriptions from './AdminSubscriptions'
import AdminUsers from './AdminUsers'
import AdminMessages from './AdminMessages'
import AdminSettings from './AdminSettings'
import AdminChallenges from './AdminChallenges'
import AdminCoupons from './AdminCoupons'
import AdminNewsletter from './AdminNewsletter'
import AdminClients from './AdminClients'
import AdminSchedule from './AdminSchedule'
import AdminSEO from './AdminSEO'

const AdminLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  
  // Check if user has any staff-like role
  const allowedRoles = ['admin', 'coach', 'content_writer']
  const hasAccess = user.is_superuser || allowedRoles.includes(user.role)
  
  if (!hasAccess) return <Navigate to="/dashboard" replace />

  const getFilteredNav = () => {
    const role = user.is_superuser ? 'superadmin' : user.role
    
    return [
      {
        label: 'Overview',
        items: [
          { to: '/admin', label: 'Dashboard', icon: FiGrid, exact: true },
        ]
      },
      // COACH SPECIFIC
      ...(role === 'coach' || role === 'superadmin' || role === 'admin' ? [{
        label: 'Coaching',
        items: [
          { to: '/admin/clients', label: 'My Clients', icon: FiUsers },
          { to: '/admin/schedule', label: 'Calendar', icon: FiCalendar },
        ]
      }] : []),
      // CONTENT / SEO SPECIFIC
      ...(role === 'content_writer' || role === 'superadmin' || role === 'admin' ? [{
        label: 'Marketing & SEO',
        items: [
          { to: '/admin/blog', label: 'Blog Posts', icon: FiFileText },
          { to: '/admin/pages', label: 'Pages & Content', icon: FiImage },
          { to: '/admin/seo', label: 'Global SEO', icon: FiTarget },
          { to: '/admin/newsletter', label: 'Newsletter', icon: FiMail },
        ]
      }] : []),
      // BUSINESS / FULL ADMIN
      ...(role === 'admin' || role === 'superadmin' ? [{
        label: 'Business',
        items: [
          { to: '/admin/workouts', label: 'Manage Workouts', icon: FiActivity },
          { to: '/admin/meal-plans', label: 'Meal Plans', icon: FiLayers },
          { to: '/admin/subscriptions', label: 'Subscriptions', icon: FiDollarSign },
          { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
          { to: '/admin/challenges', label: 'Challenges', icon: FiAward },
        ]
      }] : []),
      // SYSTEM / SUPERUSER
      ...(role === 'superadmin' || role === 'admin' ? [{
        label: 'System',
        items: [
          { to: '/admin/users', label: 'User Directory', icon: FiUsers },
          { to: '/admin/messages', label: 'Support Inbox', icon: FiMessageSquare },
          { to: '/admin/settings', label: 'Site Settings', icon: FiSettings },
        ]
      }] : []),
    ]
  }

  const navGroups = getFilteredNav()

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to) && to !== '/admin'
      ? true
      : exact
        ? location.pathname === to
        : location.pathname === to
  }

  const NavItem = ({ item }) => {
    const active = item.exact
      ? location.pathname === item.to
      : location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))
    return (
      <Link
        to={item.to}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
      >
        <item.icon size={18} />
        <span>{item.label}</span>
        {active && <FiChevronRight size={14} className="ml-auto" />}
      </Link>
    )
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-700/50">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
            <FiZap className="text-white" size={18} />
          </div>
          <div>
            <p className="text-white font-black text-sm">FitCoachPro</p>
            <p className="text-orange-400 text-xs font-semibold flex items-center space-x-1">
              <FiShield size={10} />
              <span>Admin Panel</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 px-3">{group.label}</p>
            <div className="space-y-1">
              {group.items.map(item => <NavItem key={item.to} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.first_name?.[0] || user?.username?.[0] || 'A').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.first_name || user?.username}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <Link to="/dashboard" className="mt-2 block text-center text-xs text-gray-500 hover:text-orange-400 transition-colors py-1">
          ← Back to App
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 border-r border-gray-700/50 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-gray-900 border-r border-gray-700/50 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-700/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu size={22} />
          </button>
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <FiBarChart2 size={16} />
            <span>Admin Panel</span>
            <FiChevronRight size={14} />
            <span className="text-white capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
          >
            Django Admin ↗
          </a>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="workouts/*" element={<AdminWorkouts />} />
            <Route path="meal-plans/*" element={<AdminMealPlans />} />
            <Route path="blog/*" element={<AdminBlog />} />
            <Route path="pages/*" element={<AdminPages />} />
            <Route path="subscriptions/*" element={<AdminSubscriptions />} />
            <Route path="users/*" element={<AdminUsers />} />
            <Route path="messages/*" element={<AdminMessages />} />
            <Route path="settings/*" element={<AdminSettings />} />
            <Route path="challenges/*" element={<AdminChallenges />} />
            <Route path="coupons/*" element={<AdminCoupons />} />
            <Route path="newsletter/*" element={<AdminNewsletter />} />
            <Route path="clients/*" element={<AdminClients />} />
            <Route path="schedule/*" element={<AdminSchedule />} />
            <Route path="seo/*" element={<AdminSEO />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
