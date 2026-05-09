import React, { useEffect, useState } from 'react'
import { coreAPI } from '../services/api'
import { Link } from 'react-router-dom'
import { FiBell, FiCheck } from 'react-icons/fi'

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    try {
      const response = await coreAPI.getNotifications()
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await coreAPI.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Failed to mark all read:', error)
    }
  }

  const handleMarkRead = async (notificationId) => {
    try {
      await coreAPI.markRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error('Failed to mark read:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10">
      <div className="container max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-1">Notifications</h1>
            <p className="text-gray-400">{unreadCount} unread</p>
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="btn btn-primary disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 border border-gray-700 rounded-2xl">
            <FiBell className="text-gray-600 mx-auto mb-4" size={48} />
            <p className="text-gray-400 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border p-5 ${
                  notification.is_read
                    ? 'bg-gray-800/40 border-gray-700'
                    : 'bg-orange-500/10 border-orange-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-white">{notification.icon} {notification.title}</p>
                    <p className="text-gray-300 mt-1">{notification.message}</p>
                    <p className="text-gray-500 text-xs mt-2">{new Date(notification.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.action_url && (
                      <Link to={notification.action_url} className="btn btn-primary text-sm">
                        Open
                      </Link>
                    )}
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-sm"
                      >
                        <FiCheck size={14} />
                        Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
