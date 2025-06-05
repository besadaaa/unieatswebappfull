import { supabase } from './supabase'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  action_url?: string
  metadata?: any
  created_at: string
  read_at?: string
}

export class NotificationsService {
  // Get notifications for current user
  static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error fetching unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  // Create a new notification
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
          metadata,
          read: false
        })

      if (error) {
        console.error('Error creating notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      return false
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  // Create system-wide notification for all users
  static async createSystemNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string
  ): Promise<boolean> {
    try {
      // Get all user IDs
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')

      if (usersError) {
        console.error('Error fetching users for system notification:', usersError)
        return false
      }

      if (!users || users.length === 0) {
        return true // No users to notify
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
        action_url: actionUrl,
        read: false
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        console.error('Error creating system notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating system notifications:', error)
      return false
    }
  }

  // Create notification for specific user roles
  static async createRoleNotification(
    roles: string[],
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string
  ): Promise<boolean> {
    try {
      // Get users with specified roles
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', roles)

      if (usersError) {
        console.error('Error fetching users for role notification:', usersError)
        return false
      }

      if (!users || users.length === 0) {
        return true // No users to notify
      }

      // Create notifications for users with specified roles
      const notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
        action_url: actionUrl,
        read: false
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        console.error('Error creating role notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating role notifications:', error)
      return false
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  }
}

export default NotificationsService
