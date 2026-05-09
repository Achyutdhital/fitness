import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add authorization token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (username, password) => api.post('/auth/login/', { username, password }),
  getProfile: () => api.get('/auth/user/me/'),
  updateProfile: (data) => api.post('/auth/user/update_profile/', data),
  changePassword: (data) => api.post('/auth/user/change_password/', data),
  getSubscription: () => api.get('/auth/user/subscription/'),
  getProfileDetails: () => api.get('/auth/user/profile/'),
  updateProfileDetails: (data) => api.post('/auth/user/update_profile_details/', data),
  getDashboardStats: () => api.get('/auth/user/dashboard_stats/'),
  requestPasswordReset: (email) => api.post('/auth/password-reset/', { email }),
  confirmPasswordReset: (uid, token, new_password, confirm_password) =>
    api.post('/auth/password-reset/confirm/', { uid, token, new_password, confirm_password }),
  getAdminStats: () => api.get('/auth/admin/stats/'),
}

// Subscription APIs
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans/'),
  getPlanDetails: (id) => api.get(`/subscriptions/plans/${id}/`),
  createPlan: (data) => api.post('/subscriptions/plans/', data),
  updatePlan: (id, data) => api.patch(`/subscriptions/plans/${id}/`, data),
  deletePlan: (id) => api.delete(`/subscriptions/plans/${id}/`),
  getFeatures: () => api.get('/subscriptions/features/'),
  comparePlans: () => api.get('/subscriptions/plans/compare/'),
}

// Workout APIs
export const workoutAPI = {
  getWorkouts: (params) => api.get('/workouts/workouts/', { params }),
  getWorkoutDetails: (id) => api.get(`/workouts/workouts/${id}/`),
  createWorkout: (data) => api.post('/workouts/workouts/', data),
  updateWorkout: (id, data) => api.patch(`/workouts/workouts/${id}/`, data),
  deleteWorkout: (id) => api.delete(`/workouts/workouts/${id}/`),
  getCategories: () => api.get('/workouts/categories/'),
  createCategory: (data) => api.post('/workouts/categories/', data),
  updateCategory: (id, data) => api.patch(`/workouts/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/workouts/categories/${id}/`),
  getMyWorkouts: () => api.get('/workouts/workouts/my_workouts/'),
  getFeaturedWorkouts: () => api.get('/workouts/workouts/featured/'),
  markWorkoutComplete: (id, data) => api.post(`/workouts/workouts/${id}/mark_complete/`, data),
  getProgress: () => api.get('/workouts/progress/my_progress/'),
  getStats: () => api.get('/workouts/progress/stats/'),
  getMealPlans: (params) => api.get('/workouts/meal-plans/', { params }),
  getMealPlanDetails: (id) => api.get(`/workouts/meal-plans/${id}/`),
  createMealPlan: (data) => api.post('/workouts/meal-plans/', data),
  updateMealPlan: (id, data) => api.patch(`/workouts/meal-plans/${id}/`, data),
  deleteMealPlan: (id) => api.delete(`/workouts/meal-plans/${id}/`),
  getMyMealPlans: () => api.get('/workouts/meal-plans/my_plans/'),
}

// Payment APIs
export const paymentAPI = {
  createPaymentIntent: (planId, couponCode = '') => api.post('/payments/payments/create_payment_intent/', { plan_id: planId, coupon_code: couponCode }),
  confirmPayment: (paymentIntentId, planId) => api.post('/payments/payments/confirm_payment/', { payment_intent_id: paymentIntentId, plan_id: planId }),
  getPayments: () => api.get('/payments/payments/my_payments/'),
  cancelSubscription: () => api.post('/payments/payments/cancel_subscription/', {}),
  requestRefund: (paymentId, reason) => api.post('/payments/payments/create_refund/', { payment_id: paymentId, reason }),
  getInvoices: () => api.get('/payments/invoices/my_invoices/'),
  downloadInvoice: (invoiceId) => api.get(`/payments/invoices/download/${invoiceId}/`),
}

// Core APIs - Gamification, Favorites, Reviews, Measurements, Notifications, Coupons
export const coreAPI = {
  // Favorites
  getFavoriteWorkouts: () => api.get('/core/favorites/workouts/'),
  toggleWorkoutFavorite: (workout_id) => api.post('/core/favorites/toggle_workout/', { workout_id }),
  getFavoriteMealPlans: () => api.get('/core/favorites/meal_plans/'),
  toggleMealPlanFavorite: (meal_plan_id) => api.post('/core/favorites/toggle_meal_plan/', { meal_plan_id }),

  // Reviews
  submitReview: (workout_id, rating, comment) => api.post('/core/reviews/submit/', { workout_id, rating, comment }),
  getWorkoutReviews: (workout_id) => api.get('/core/reviews/for_workout/', { params: { workout_id } }),

  // Body Measurements
  getMeasurements: () => api.get('/core/measurements/history/'),
  getLatestMeasurement: () => api.get('/core/measurements/latest/'),
  addMeasurement: (data) => api.post('/core/measurements/', data),

  // Gamification
  getMyStats: () => api.get('/core/gamification/my_stats/'),
  getLeaderboard: () => api.get('/core/gamification/leaderboard/'),
  getAllAchievements: () => api.get('/core/gamification/all_achievements/'),

  // Challenges
  getChallenges: () => api.get('/core/challenges/'),
  joinChallenge: (id) => api.post(`/core/challenges/${id}/join/`),
  getMyChallenges: () => api.get('/core/challenges/my_challenges/'),

  // Notifications
  getNotifications: () => api.get('/core/notifications/list_all/'),
  getUnreadCount: () => api.get('/core/notifications/unread_count/'),
  markAllRead: () => api.post('/core/notifications/mark_all_read/'),
  markRead: (notification_id) => api.post('/core/notifications/mark_read/', { notification_id }),

  // Coupons
  validateCoupon: (code, plan_id) => api.post('/core/coupons/validate/', { code, plan_id }),

  // Referrals
  getMyReferral: () => api.get('/core/referrals/my_referral/'),

  // Support
  submitTicket: (data) => api.post('/core/support/submit/', data),
  getMyTickets: () => api.get('/core/support/my_tickets/'),
}

// CMS APIs - Website Content
export const cmsAPI = {
  // Website Settings
  getSettings: () => api.get('/cms/settings/'),
  updateSettings: (data) => api.put('/cms/settings/', data),
  
  // Blog
  getBlogPosts: (params) => api.get('/cms/blog/posts/', { params }),
  getBlogPostDetail: (slug) => api.get(`/cms/blog/posts/${slug}/`),
  createBlogPost: (data) => api.post('/cms/blog/posts/', data),
  updateBlogPost: (slug, data) => api.patch(`/cms/blog/posts/${slug}/`, data),
  deleteBlogPost: (slug) => api.delete(`/cms/blog/posts/${slug}/`),
  getFeaturedBlogPosts: () => api.get('/cms/blog/posts/featured/'),
  getLatestBlogPosts: (limit = 10) => api.get('/cms/blog/posts/latest/', { params: { limit } }),
  searchBlogPosts: (query, category) => api.get('/cms/blog/posts/search/', { params: { q: query, category } }),
  getBlogPostsByCategory: (slug) => api.get('/cms/blog/posts/by_category/', { params: { slug } }),
  incrementBlogViews: (slug) => api.post(`/cms/blog/posts/${slug}/increment_views/`),
  getBlogCategories: () => api.get('/cms/blog/categories/'),
  getBlogCategoryDetail: (slug) => api.get(`/cms/blog/categories/${slug}/`),
  createBlogCategory: (data) => api.post('/cms/blog/categories/', data),
  updateBlogCategory: (slug, data) => api.patch(`/cms/blog/categories/${slug}/`, data),
  deleteBlogCategory: (slug) => api.delete(`/cms/blog/categories/${slug}/`),
  
  // Contact Form
  submitContact: (data) => api.post('/cms/contact/', data),
  getContactMessages: () => api.get('/cms/contact/'),
  
  // Dynamic Pages
  getPages: () => api.get('/cms/pages/'),
  getPageDetail: (slug) => api.get(`/cms/pages/${slug}/`),
  createPage: (data) => api.post('/cms/pages/', data),
  updatePage: (slug, data) => api.patch(`/cms/pages/${slug}/`, data),
  deletePage: (slug) => api.delete(`/cms/pages/${slug}/`),
  getFooterPages: () => api.get('/cms/pages/footer_pages/'),
  getMenuPages: () => api.get('/cms/pages/menu_pages/'),
  
  // Social Media Links
  getSocialLinks: () => api.get('/cms/social-links/'),
  
  // Newsletter
  subscribeNewsletter: (email, name = '') => api.post('/cms/newsletter/', { email, name }),
  getNewsletterSubscribers: () => api.get('/cms/newsletter/'),

  // Page Sections (Dynamic Page Builder)
  getSectionsByPage: (page) => api.get(`/cms/sections/by_page/?page=${page}`),
  getAllSections: () => api.get('/cms/sections/'),
  createSection: (data) => api.post('/cms/sections/', data),
  updateSection: (id, data) => api.put(`/cms/sections/${id}/`, data),
  deleteSection: (id) => api.delete(`/cms/sections/${id}/`),

  // Section Items (Cards, Pricing Tiers, etc.)
  getSectionItems: (sectionId) => api.get(`/cms/section-items/?section=${sectionId}`),
  createSectionItem: (data) => api.post('/cms/section-items/', data),
  updateSectionItem: (id, data) => api.put(`/cms/section-items/${id}/`, data),
  deleteSectionItem: (id) => api.delete(`/cms/section-items/${id}/`),

  // Image Assets (Centralized Images)
  getImageAssets: () => api.get('/cms/assets/'),
  getImageAssetsByCategory: (category) => api.get(`/cms/assets/by_category/?category=${category}`),
  uploadImageAsset: (formData) => api.post('/cms/assets/', formData),
  updateImageAsset: (id, data) => api.put(`/cms/assets/${id}/`, data),
  deleteImageAsset: (id) => api.delete(`/cms/assets/${id}/`),
}

export default api

// Admin Users API
export const adminAPI = {
  getUsers: () => api.get('/auth/admin/users/'),
  updateUser: (id, data) => api.patch(`/auth/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/admin/users/${id}/`),
}
