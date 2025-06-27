import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      title, 
      message, 
      type, 
      related_order_id,
      send_to_all = false 
    } = body

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, type' },
        { status: 400 }
      )
    }

    if (!send_to_all && !user_id) {
      return NextResponse.json(
        { error: 'user_id is required when send_to_all is false' },
        { status: 400 }
      )
    }

    let notifications = []

    if (send_to_all) {
      // Send to all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
        is_read: false,
        related_order_id,
        created_at: new Date().toISOString()
      }))
    } else {
      // Send to specific user
      notifications = [{
        user_id,
        title,
        message,
        type,
        is_read: false,
        related_order_id,
        created_at: new Date().toISOString()
      }]
    }

    // Insert notifications
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      throw new Error(`Failed to create notifications: ${error.message}`)
    }

    console.log(`Created ${notifications.length} notification(s)`)

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${notifications.length} notification(s)`,
      data: data
    })

  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to send order status notifications
export async function sendOrderStatusNotification(
  userId: string,
  orderNumber: string,
  status: string,
  orderId?: string
) {
  const statusMessages = {
    'pending': {
      title: 'Order Received',
      message: `Your order #${orderNumber} has been received and is being prepared.`,
      type: 'order_status'
    },
    'preparing': {
      title: 'Order Being Prepared',
      message: `Your order #${orderNumber} is currently being prepared.`,
      type: 'order_status'
    },
    'ready': {
      title: 'Order Ready for Pickup',
      message: `Your order #${orderNumber} is ready for pickup!`,
      type: 'order_ready'
    },
    'completed': {
      title: 'Order Completed',
      message: `Your order #${orderNumber} has been completed. Thank you for using UniEats!`,
      type: 'order_completed'
    },
    'cancelled': {
      title: 'Order Cancelled',
      message: `Your order #${orderNumber} has been cancelled.`,
      type: 'order_status'
    }
  }

  const notification = statusMessages[status as keyof typeof statusMessages]
  
  if (!notification) {
    throw new Error(`Unknown order status: ${status}`)
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: false,
        related_order_id: orderId,
        created_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to send order notification: ${error.message}`)
    }

    console.log(`Order status notification sent to user ${userId} for order ${orderNumber}`)
    return true
  } catch (error) {
    console.error('Error sending order status notification:', error)
    return false
  }
}

// Helper function to send payment notifications
export async function sendPaymentNotification(
  userId: string,
  orderNumber: string,
  success: boolean,
  orderId?: string
) {
  const notification = success ? {
    title: 'Payment Successful',
    message: `Payment for order #${orderNumber} was successful.`,
    type: 'payment_success'
  } : {
    title: 'Payment Failed',
    message: `Payment for order #${orderNumber} failed. Please try again.`,
    type: 'payment_failed'
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: false,
        related_order_id: orderId,
        created_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to send payment notification: ${error.message}`)
    }

    console.log(`Payment notification sent to user ${userId} for order ${orderNumber}`)
    return true
  } catch (error) {
    console.error('Error sending payment notification:', error)
    return false
  }
}

// Helper function to send promotional notifications
export async function sendPromotionalNotification(
  title: string,
  message: string,
  sendToAll: boolean = true,
  userId?: string
) {
  try {
    let notifications = []

    if (sendToAll) {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type: 'promotion',
        is_read: false,
        created_at: new Date().toISOString()
      }))
    } else if (userId) {
      notifications = [{
        user_id: userId,
        title,
        message,
        type: 'promotion',
        is_read: false,
        created_at: new Date().toISOString()
      }]
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      throw new Error(`Failed to send promotional notification: ${error.message}`)
    }

    console.log(`Promotional notification sent to ${notifications.length} user(s)`)
    return true
  } catch (error) {
    console.error('Error sending promotional notification:', error)
    return false
  }
}
