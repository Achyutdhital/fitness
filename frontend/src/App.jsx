import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AICoach from './components/AICoach'

import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import LoginPage from './pages/LoginPage'
import EnhancedSignupPage from './pages/SignupPageNew'
import { Navigate } from 'react-router-dom'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutsPage from './pages/WorkoutsPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import MealPlansPage from './pages/MealPlansPage'
import PaymentPage from './pages/PaymentPage'
import ProfilePage from './pages/ProfilePage'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import PageDetailPage from './pages/PageDetailPage'
import ContactPage from './pages/ContactPage'
import AchievementsPage from './pages/AchievementsPage'
import ChallengesPage from './pages/ChallengesPage'
import MeasurementsPage from './pages/MeasurementsPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminLayout from './pages/admin/AdminLayout'
import CoachDashboard from './pages/CoachDashboard'
import CoachingPage from './pages/CoachingPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Routes>
              <Route path="/admin/*" element={<AdminLayout />} />
              
              {/* Onboarding & Auth - No Navbar/Footer */}
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/signup" element={<EnhancedSignupPage />} />
              <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
              
              {/* Main App - With Navbar/Footer */}
              <Route path="/*" element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      {/* Public */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<Navigate to="/onboarding" replace />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
                      <Route path="/subscriptions" element={<SubscriptionsPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogDetailPage />} />
                      <Route path="/pages/:slug" element={<PageDetailPage />} />
                      <Route path="/contact" element={<ContactPage />} />

                      {/* Protected */}
                      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                      <Route path="/workouts" element={<ProtectedRoute><WorkoutsPage /></ProtectedRoute>} />
                      <Route path="/workouts/:id" element={<ProtectedRoute><WorkoutDetailPage /></ProtectedRoute>} />
                      <Route path="/meal-plans" element={<ProtectedRoute><MealPlansPage /></ProtectedRoute>} />
                      <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/profile/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                      <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
                      <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
                      <Route path="/measurements" element={<ProtectedRoute><MeasurementsPage /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                      <Route path="/coach-dashboard" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
                      <Route path="/coaching" element={<ProtectedRoute><CoachingPage /></ProtectedRoute>} />

                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                  <AICoach />
                </>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  )
}

export default App
