"use client"

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notificationService, Notification } from '@/lib/notifications'
import { formatDistanceToNow } from 'date-fns'
import { useUser } from '@/hooks/use-user'

export default function NotificationsPage() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (user?.id) {
      initializeNotifications()
    }
  }, [user])

  useEffect(() => {
    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail as Notification
      setNotifications(prev => [newNotification, ...prev])
    }

    // Listen for notification updates
    const handleNotificationUpdate = (event: CustomEvent) => {
      const updatedNotification = event.detail as Notification
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === updatedNotification.id ? updatedNotification : notif
        )
      )
    }

    window.addEventListener('newNotification', handleNewNotification as EventListener)
    window.addEventListener('notificationUpdate', handleNotificationUpdate as EventListener)

    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener)
      window.removeEventListener('notificationUpdate', handleNotificationUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    // Filter notifications based on selected filter
    switch (filter) {
      case 'unread':
        setFilteredNotifications(notifications.filter(n => !n.is_read))
        break
      case 'read':
        setFilteredNotifications(notifications.filter(n => n.is_read))
        break
      default:
        setFilteredNotifications(notifications)
        break
    }
  }, [notifications, filter])

  const initializeNotifications = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      await notificationService.initialize(user.id)
      await loadNotifications()
    } catch (error) {
      console.error('Error initializing notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(100)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to related content
    notificationService.navigateToNotification(notification)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return '📦'
      case 'order_ready':
        return '✅'
      case 'order_completed':
        return '🎉'
      case 'payment_success':
        return '💳'
      case 'payment_failed':
        return '❌'
      case 'promotion':
        return '🎁'
      case 'announcement':
        return '📢'
      case 'inventory_alert':
        return '⚠️'
      default:
        return '🔔'
    }
  }

  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch {
      return 'Just now'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view notifications.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 
                 'No notifications yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatNotificationTime(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              className="h-auto p-1"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        {notification.related_order_id && (
                          <Badge variant="outline" className="text-xs">
                            Order #{notification.related_order_id.slice(-8)}
                          </Badge>
                        )}
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
