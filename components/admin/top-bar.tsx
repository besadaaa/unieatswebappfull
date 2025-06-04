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

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  created_at: string
  read: boolean
}

export function AdminTopBar() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // Mock notifications - in a real app, you'd fetch from your notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Cafeteria Registration',
          message: 'A new cafeteria "Campus Cafe" has requested approval',
          type: 'info',
          created_at: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'System Alert',
          message: 'High order volume detected - consider scaling resources',
          type: 'warning',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'Payment Issue',
          message: 'Payment gateway reported 3 failed transactions',
          type: 'error',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          read: true
        }
      ]
      
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '🔴'
      case 'warning': return '🟡'
      case 'success': return '🟢'
      default: return '🔵'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="flex justify-end items-center p-4 gap-3 animate-slide-in-down">
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
                  onClick={() => {
                    markAsRead(notification.id)
                    router.push('/admin/notifications')
                  }}
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
            onClick={() => router.push('/admin/notifications')}
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
          <DropdownMenuLabel className="gradient-text">Admin Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/20" />
          
          <DropdownMenuItem
            onClick={() => router.push('/admin/profile')}
            className="text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <User size={16} className="mr-2" />
            Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push('/admin/settings')}
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
  )
}
