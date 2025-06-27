"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Bell, Check, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { announce, createFocusTrap } from "@/lib/accessibility"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
}

interface MobileNotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNotificationsPanel({ isOpen, onClose }: MobileNotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null)

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    // Focus the close button when panel opens
    closeButtonRef.current?.focus()

    // Create focus trap
    const handleKeyDown = createFocusTrap(panelRef.current)

    // Add event listener
    document.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
        announce("Notifications panel closed")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Load notifications from localStorage
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      // This would be replaced with actual Supabase call to get user notifications
      // For now, we'll use an empty array since we don't have a notifications table yet
      const notifications: any[] = []

      setNotifications(notifications)
      setNotificationCount(notifications.filter((n: any) => !n.read).length)
    } catch (error) {
      console.error("Error loading notifications:", error)
      setNotifications([])
      setNotificationCount(0)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: Implement with Supabase notifications table when available
      // For now, just update local state
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      setNotificationCount(0)
      announce("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      // TODO: Implement with Supabase notifications table when available
      // For now, just update local state
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setNotificationCount((prev) => Math.max(0, prev - 1))
      announce("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleDeleteNotification = (id: string) => {
    const cafeteriaMessages = JSON.parse(localStorage.getItem("cafeteriaMessages") || "[]")
    const updatedMessages = cafeteriaMessages.filter((msg: any) => msg.id !== id)
    localStorage.setItem("cafeteriaMessages", JSON.stringify(updatedMessages))

    // Update state
    const updatedNotifications = notifications.filter((n) => n.id !== id)
    setNotifications(updatedNotifications)

    // Recalculate unread count
    const unreadCount = updatedNotifications.filter((n) => !n.read).length
    setNotificationCount(unreadCount)
    announce("Notification deleted")
  }

  const handleViewNotification = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate based on notification type
    let targetPath = "/cafeteria/support" // Default fallback

    if (notification.title.toLowerCase().includes('order')) {
      targetPath = "/cafeteria/orders"
    } else if (notification.title.toLowerCase().includes('stock') || notification.title.toLowerCase().includes('inventory')) {
      targetPath = "/cafeteria/inventory"
    } else if (notification.title.toLowerCase().includes('review')) {
      targetPath = "/cafeteria/analytics"
    }

    router.push(targetPath)
    onClose()
    announce(`Navigating to ${targetPath.split('/').pop()} page`)
  }

  // Format time ago helper
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString()
  }

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartY === null) return

    const currentY = e.touches[0].clientY
    const diff = currentY - swipeStartY

    // If swiping down more than 50px, close the panel
    if (diff > 50) {
      setSwipeStartY(null)
      onClose()
      announce("Notifications panel closed")
    }
  }

  const handleTouchEnd = () => {
    setSwipeStartY(null)
  }

  const filteredNotifications = activeTab === "all" ? notifications : notifications.filter((n) => !n.read)

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-title"
        >
          <div className="sr-only" tabIndex={-1} aria-hidden="true">
            Press Escape to close the notifications panel
          </div>

          <motion.div
            className="mt-auto bg-[#1a1f36] text-white rounded-t-xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            ref={panelRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Handle for dragging */}
            <div className="w-full flex justify-center pt-2 pb-1" aria-hidden="true">
              <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2f46]">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-yellow-500" aria-hidden="true" />
                <h2 className="text-lg font-semibold" id="notifications-title">
                  Notifications
                </h2>
                {notificationCount > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full"
                    aria-label={`${notificationCount} unread`}
                  >
                    {notificationCount}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#1a1f36]"
                aria-label="Close notifications panel"
                ref={closeButtonRef}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2f46]" role="tablist" aria-label="Notification filters">
              <button
                className={`flex-1 py-3 text-center font-medium text-sm ${
                  activeTab === "all" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-400"
                }`}
                onClick={() => {
                  setActiveTab("all")
                  announce("Showing all notifications")
                }}
                role="tab"
                aria-selected={activeTab === "all"}
                aria-controls="all-notifications-panel"
                id="all-notifications-tab"
                tabIndex={activeTab === "all" ? 0 : -1}
              >
                All
              </button>
              <button
                className={`flex-1 py-3 text-center font-medium text-sm ${
                  activeTab === "unread" ? "text-yellow-500 border-b-2 border-yellow-500" : "text-gray-400"
                }`}
                onClick={() => {
                  setActiveTab("unread")
                  announce("Showing unread notifications")
                }}
                role="tab"
                aria-selected={activeTab === "unread"}
                aria-controls="unread-notifications-panel"
                id="unread-notifications-tab"
                tabIndex={activeTab === "unread" ? 0 : -1}
              >
                Unread
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex justify-end px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-yellow-500 hover:text-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#1a1f36]"
                  onClick={handleMarkAllAsRead}
                  disabled={notificationCount === 0}
                  aria-label="Mark all notifications as read"
                >
                  <Check className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Mark all as read
                </Button>
              </div>
            )}

            {/* Notification List */}
            <div
              className="flex-1 overflow-y-auto"
              role="tabpanel"
              id={activeTab === "all" ? "all-notifications-panel" : "unread-notifications-panel"}
              aria-labelledby={activeTab === "all" ? "all-notifications-tab" : "unread-notifications-tab"}
            >
              {filteredNotifications.length > 0 ? (
                <ul
                  className="divide-y divide-[#2a2f46]"
                  role="list"
                  aria-label={activeTab === "all" ? "All notifications" : "Unread notifications"}
                >
                  {filteredNotifications.map((notification) => (
                    <li key={notification.id} className="relative" role="listitem">
                      <div
                        className="px-4 py-3 flex flex-col active:bg-[#2a2f46] focus-within:bg-[#2a2f46]"
                        onClick={() => handleViewNotification(notification)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${notification.title}${!notification.read ? ", unread" : ""}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleViewNotification(notification)
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium flex items-center">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 h-2 w-2 rounded-full bg-yellow-500" aria-hidden="true"></span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">{formatTimeAgo(notification.time)}</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">{notification.description}</p>

                        {/* Action buttons */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-blue-600 text-white focus:ring-2 focus:ring-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              aria-label="Mark as read"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-red-600 text-white focus:ring-2 focus:ring-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNotification(notification.id)
                            }}
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>

                        <ChevronRight
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
                          aria-hidden="true"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-40 text-gray-400"
                  role="status"
                  aria-live="polite"
                >
                  <Bell className="h-8 w-8 mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">{activeTab === "all" ? "No notifications yet" : "No unread notifications"}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#2a2f46] p-4">
              <Button
                className="w-full bg-[#2a2f46] hover:bg-[#3a3f56] text-white focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#1a1f36]"
                onClick={() => {
                  router.push("/cafeteria/support")
                  onClose()
                  announce("Navigating to support page")
                }}
              >
                View All in Support
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
