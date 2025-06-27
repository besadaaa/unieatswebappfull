"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Trash2, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { CafeteriaPageHeader } from "@/components/cafeteria/page-header"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  related_order_id?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const { user } = useUser()
  const router = useRouter()

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        console.log('No user found for notifications')
        setNotifications([])
        return
      }

      // Try to fetch real notifications from Supabase
      try {
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            console.log('Notifications table does not exist, using fallback')
            setNotifications([])
          } else {
            throw error
          }
        } else {
          setNotifications(notificationsData || [])
        }
      } catch (error) {
        console.warn('Error fetching notifications:', error)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId)
      
      // Try to update in Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)

        if (error && error.code !== 'PGRST116') {
          console.warn('Error updating notification:', error)
        }
      } catch (error) {
        console.warn('Error updating notification in database:', error)
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )

      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(null)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      
      if (unreadNotifications.length === 0) {
        toast({
          title: "No unread notifications",
          description: "All notifications are already marked as read.",
        })
        return
      }

      // Try to update in Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user?.id)
          .eq('read', false)

        if (error && error.code !== 'PGRST116') {
          console.warn('Error updating notifications:', error)
        }
      } catch (error) {
        console.warn('Error updating notifications in database:', error)
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )

      toast({
        title: "All notifications marked as read",
        description: `${unreadNotifications.length} notifications marked as read.`,
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      })
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    let targetPath = "/cafeteria/dashboard" // Default fallback

    if (notification.type === 'order' || notification.related_order_id) {
      targetPath = "/cafeteria/orders"
    } else if (notification.type === 'inventory' || notification.title.toLowerCase().includes('stock')) {
      targetPath = "/cafeteria/inventory"
    } else if (notification.type === 'review' || notification.title.toLowerCase().includes('review')) {
      targetPath = "/cafeteria/analytics"
    } else if (notification.type === 'support' || notification.title.toLowerCase().includes('support')) {
      targetPath = "/cafeteria/support"
    }

    router.push(targetPath)
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '🛒'
      case 'inventory':
      case 'stock':
        return '📋'
      case 'review':
        return '⭐'
      case 'support':
        return '🎧'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return '🔔'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user?.id])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <CafeteriaPageHeader
        title="Notifications"
        subtitle="Stay updated with your cafeteria activities"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-400" />
              <span className="text-lg font-medium">
                {notifications.length} Total
              </span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="bg-red-500">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              className="glass-effect border-white/20 hover:border-emerald-500/50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="glass-effect border-white/20 hover:border-blue-500/50"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="modern-card glass-effect animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="modern-card glass-effect border-2">
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Notifications</h3>
              <p className="text-slate-400">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`modern-card glass-effect hover-lift cursor-pointer transition-all duration-300 border-2 ${
                  notification.read 
                    ? 'border-white/10 opacity-75' 
                    : 'border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${notification.read ? 'text-slate-400' : 'text-slate-300'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            disabled={notification.read || markingAsRead === notification.id}
                            className="text-slate-400 hover:text-white"
                          >
                            {markingAsRead === notification.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
