import { supabase } from './supabase'
import { toast } from '@/components/ui/use-toast'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  related_order_id?: string
}

export interface PushToken {
  id: string
  user_id: string
  token: string
  platform: string
  is_active: boolean
  created_at: string
  updated_at: string
}

class NotificationService {
  private static instance: NotificationService
  private subscription: any = null
  private userId: string | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Initialize real-time notifications
  async initialize(userId: string) {
    this.userId = userId
    await this.setupRealtimeSubscription()
    await this.registerPushToken()
  }

  // Setup real-time subscription for notifications
  private async setupRealtimeSubscription() {
    if (!this.userId) return

    // Unsubscribe from previous subscription
    if (this.subscription) {
      this.subscription.unsubscribe()
    }

    // Subscribe to new notifications for this user
    this.subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          this.handleNewNotification(payload.new as Notification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          console.log('Notification updated:', payload)
          this.handleNotificationUpdate(payload.new as Notification)
        }
      )
      .subscribe()
  }

  // Handle new notification
  private handleNewNotification(notification: Notification) {
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    })

    // Play notification sound (optional)
    this.playNotificationSound()

    // Trigger custom event for components to listen
    window.dispatchEvent(new CustomEvent('newNotification', { 
      detail: notification 
    }))
  }

  // Handle notification update
  private handleNotificationUpdate(notification: Notification) {
    window.dispatchEvent(new CustomEvent('notificationUpdate', { 
      detail: notification 
    }))
  }

  // Play notification sound
  private playNotificationSound() {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.3
      audio.play().catch(e => console.log('Could not play notification sound:', e))
    } catch (error) {
      console.log('Notification sound not available')
    }
  }

  // Register push notification token for web
  async registerPushToken() {
    if (!this.userId) return

    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return
      }

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return
      }

      // For web, we'll use a unique identifier
      const webToken = `web_${this.userId}_${Date.now()}`

      // Save token to database
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: this.userId,
          token: webToken,
          platform: 'web',
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        })

      if (error) {
        console.error('Error saving push token:', error)
      } else {
        console.log('Push token registered successfully')
      }
    } catch (error) {
      console.error('Error registering push token:', error)
    }
  }

  // Get all notifications for user
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    if (!this.userId) return []

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<boolean> {
    if (!this.userId) return false

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', this.userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    if (!this.userId) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  }

  // Navigate to notification target
  navigateToNotification(notification: Notification) {
    switch (notification.type) {
      case 'order_status':
      case 'order_ready':
      case 'order_completed':
        if (notification.related_order_id) {
          // Navigate to order details
          window.location.href = `/orders/${notification.related_order_id}`
        }
        break
      case 'payment_success':
      case 'payment_failed':
        if (notification.related_order_id) {
          window.location.href = `/orders/${notification.related_order_id}`
        }
        break
      case 'promotion':
      case 'announcement':
        // Navigate to promotions or announcements page
        window.location.href = '/promotions'
        break
      default:
        // Navigate to notifications page
        window.location.href = '/notifications'
        break
    }
  }

  // Create notification (for admin/system use)
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedOrderId?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        related_order_id: relatedOrderId,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    return true
  }

  // Cleanup
  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.userId = null
  }
}

export const notificationService = NotificationService.getInstance()
