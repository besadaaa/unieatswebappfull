"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, User, Settings, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/app/actions/auth"
import { supabase, getCurrentUser } from "@/lib/supabase"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  created_at: string
  read: boolean
}

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function CafeteriaPageHeader({ title, subtitle }: PageHeaderProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        // Set empty state if no user
        setNotifications([])
        setUnreadCount(0)
        return
      }

      // Get cafeteria for current user
      const { data: cafeterias, error: cafeteriaError } = await supabase
        .from('cafeterias')
        .select('id')
        .eq('owner_id', currentUser.id)
        .single()

      if (cafeteriaError || !cafeterias) {
        console.warn('Error fetching cafeteria or no cafeteria found:', cafeteriaError?.message || 'No cafeteria')
        // Set empty state and return
        setNotifications([])
        setUnreadCount(0)
        return
      }

      // Fetch real notifications from Supabase (with fallback)
      let notificationsData: any[] = []
      let newOrders: any[] = []

      // Safely fetch notifications
      try {
        const notificationsResult = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (notificationsResult.error) {
          // Check if table doesn't exist
          if (notificationsResult.error.code === 'PGRST116' ||
              notificationsResult.error.message?.includes('does not exist') ||
              notificationsResult.error.message?.includes('relation') ||
              notificationsResult.error.message?.includes('table')) {
            console.log('Notifications table does not exist, using fallback')
          } else {
            console.warn('Error fetching notifications:', notificationsResult.error.message)
          }
        } else {
          notificationsData = notificationsResult.data || []
        }
      } catch (error: any) {
        console.log('Notifications fetch failed, using fallback:', error?.message || 'Unknown error')
      }

      // Safely fetch new orders as notifications
      try {
        const ordersResult = await supabase
          .from('orders')
          .select('id, created_at, status, total_amount, users(full_name)')
          .eq('cafeteria_id', cafeterias.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)

        if (ordersResult.error) {
          console.warn('Error fetching orders for notifications:', ordersResult.error.message)
        } else {
          newOrders = ordersResult.data || []
        }
      } catch (error: any) {
        console.log('Orders fetch failed for notifications:', error?.message || 'Unknown error')
      }

      // Combine notifications and new orders safely
      const combinedNotifications: Notification[] = []

      // Add real notifications if available
      if (Array.isArray(notificationsData)) {
        notificationsData.forEach(n => {
          try {
            combinedNotifications.push({
              id: n.id || `notif-${Date.now()}-${Math.random()}`,
              title: n.title || 'Notification',
              message: n.message || '',
              type: n.type || 'info',
              created_at: n.created_at || new Date().toISOString(),
              read: n.is_read || false,
              related_order_id: n.related_order_id
            })
          } catch (error) {
            console.warn('Error processing notification:', error)
          }
        })
      }

      // Add new orders as notifications if available
      if (Array.isArray(newOrders)) {
        newOrders.forEach(order => {
          try {
            combinedNotifications.push({
              id: `order-${order.id}`,
              title: 'New Order Received',
              message: `Order from ${order.users?.full_name || 'Customer'} - ${order.total_amount || 0} EGP`,
              type: 'order' as const,
              created_at: order.created_at || new Date().toISOString(),
              read: false,
              related_order_id: order.id
            })
          } catch (error) {
            console.warn('Error processing order notification:', error)
          }
        })
      }

      // Sort by creation date
      combinedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setNotifications(combinedNotifications.slice(0, 10))
      setUnreadCount(combinedNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.warn('Error fetching notifications:', error)
      // Set fallback notifications to prevent UI errors
      setNotifications([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    // Add global error handler for this component
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('notifications') ||
          event.reason?.message?.includes('PGRST116') ||
          event.reason?.stack?.includes('fetchNotifications')) {
        console.log('Notification error handled gracefully')
        event.preventDefault()
        setNotifications([])
        setUnreadCount(0)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Safely fetch notifications on mount
    fetchNotifications().catch(err => {
      console.warn('Initial notification fetch failed:', err)
      setNotifications([])
      setUnreadCount(0)
    })

    // Set up real-time subscription for notifications
    const setupRealtimeSubscription = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) return

        // Subscribe to notifications table changes (with error handling)
        try {
          const notificationChannel = supabase
            .channel('notifications')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${currentUser.id}`
              },
              (payload) => {
                console.log('Notification change received:', payload)
                fetchNotifications().catch(err => console.warn('Error refreshing notifications:', err))
              }
            )
            .subscribe()
        } catch (error) {
          console.log('Notifications subscription not available:', error)
        }

        // Subscribe to orders table changes for new orders
        try {
          const { data: cafeterias, error: cafeteriaError } = await supabase
            .from('cafeterias')
            .select('id')
            .eq('owner_id', currentUser.id)
            .single()

          if (cafeteriaError || !cafeterias) {
            console.log('Could not get cafeteria for orders subscription')
            return
          }

          const orderChannel = supabase
            .channel('orders')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `cafeteria_id=eq.${cafeterias.id}`
              },
              (payload) => {
                console.log('New order received:', payload)
                fetchNotifications().catch(err => console.warn('Error refreshing notifications:', err))
              }
            )
            .subscribe()
        } catch (error) {
          console.log('Orders subscription not available:', error)
        }
      } catch (error) {
        console.log('Real-time subscription setup failed:', error)
      }
    }

    setupRealtimeSubscription().catch(err => console.warn('Subscription setup error:', err))

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      if (notificationId.startsWith('order-')) {
        // For order notifications, just update local state
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      } else {
        // For regular notifications, try to update in Supabase
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)

          if (error) {
            console.warn('Could not update notification in database:', error.message)
          }
        } catch (dbError) {
          console.warn('Notifications table not available for update:', dbError)
        }

        // Always update local state regardless of database result
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      }

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.warn('Error marking notification as read:', error)
      // Still try to update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // Handle notification click with proper navigation
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.id)
      }

      // Navigate based on notification type
      let targetPath = "/cafeteria/support" // Default fallback

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
    } catch (error) {
      console.warn('Error handling notification click:', error)
      // Still try to navigate to default page
      router.push("/cafeteria/support")
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '📦'
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
      case 'error':
        return '❌'
      default:
        return '🔔'
    }
  }

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    }
  }







  return (
    <div className="flex items-center justify-between mb-8 animate-slide-in-down">
      {/* Page Title */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold gradient-text mb-1">{title}</h1>
        {subtitle && (
          <p className="text-slate-400 text-lg">{subtitle}</p>
        )}
      </div>

      {/* Notification & Profile Icons */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 btn-modern glass-effect border border-white/10 hover:border-orange-500/50">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                >
                  {unreadCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-effect border-white/20">
            <DropdownMenuLabel className="gradient-text">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/20" />
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No notifications
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="p-4 cursor-pointer hover:bg-white/5 focus:bg-white/5"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-white truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            
            <DropdownMenuSeparator className="bg-white/20" />
            <DropdownMenuItem
              onClick={() => router.push('/cafeteria/notifications')}
              className="text-center text-blue-400 hover:text-blue-300 hover:bg-white/5 cursor-pointer"
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 btn-modern glass-effect border border-white/10 hover:border-orange-500/50">
              <User size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass-effect border-white/20">
            <DropdownMenuLabel className="gradient-text">Cafeteria Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/20" />
            
            <DropdownMenuItem
              onClick={() => router.push('/cafeteria/profile')}
              className="text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <User size={16} className="mr-2" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => router.push('/cafeteria/settings')}
              className="text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/20" />
            
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
