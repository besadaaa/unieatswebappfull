// Automated Order Processing System
import { supabase } from './supabase'
import { createFinancialTransaction, createSystemNotification, logUserActivity } from './financial'
import { deductInventoryForOrder, updateMenuItemAvailability } from './inventory-integration'

export interface OrderProcessingResult {
  success: boolean
  orderId: string
  transactionId?: string
  message: string
  estimatedReadyTime?: string
  errors?: string[]
}

export interface OrderNotification {
  type: 'new_order' | 'status_update' | 'ready_for_pickup' | 'completed' | 'cancelled'
  orderId: string
  cafeteriaId: string
  userId: string
  message: string
  data?: any
}

// Process new order automatically
export const processNewOrder = async (
  orderData: {
    user_id: string
    cafeteria_id: string
    order_items: {
      menu_item_id: string
      quantity: number
      price: number
      notes?: string
    }[]
    total_amount: number
    pickup_time?: string
    payment_method?: string
  }
): Promise<OrderProcessingResult> => {
  try {
    // Calculate revenue breakdown
    const subtotal = orderData.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Revenue calculations: 4% service fee (capped at 20), 10% commission
    const userServiceFee = Math.min(subtotal * 0.04, 20.00)
    const cafeteriaCommission = subtotal * 0.10
    const adminRevenue = userServiceFee + cafeteriaCommission
    const totalAmount = subtotal + userServiceFee

    console.log('Order automation revenue calculation:', {
      subtotal,
      userServiceFee,
      cafeteriaCommission,
      adminRevenue,
      totalAmount
    })

    // 1. Create the order with all revenue fields
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.user_id,
        cafeteria_id: orderData.cafeteria_id,
        student_id: orderData.user_id,
        subtotal: subtotal,
        user_service_fee: userServiceFee,
        cafeteria_commission: cafeteriaCommission,
        admin_revenue: adminRevenue,
        total_amount: totalAmount,
        status: 'new',
        pickup_time: orderData.pickup_time,
        platform: 'web',
        service_fee_percentage: 4.0,
        payment_method: 'card'
      }])
      .select()
      .single()
    
    if (orderError) throw orderError
    
    // 2. Create order items
    const orderItems = orderData.order_items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes
    }))
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) throw itemsError
    
    // 3. Create financial transaction
    const transaction = await createFinancialTransaction(
      order.id,
      orderData.cafeteria_id,
      orderData.user_id,
      orderData.total_amount,
      orderData.payment_method || 'cash_on_pickup'
    )
    
    if (!transaction) {
      throw new Error('Failed to create financial transaction')
    }
    
    // 4. Inventory deduction is handled automatically by database trigger
    console.log('✅ Inventory deduction handled automatically by database trigger for order:', order.id)
    
    // 5. Update menu item availability
    await updateMenuItemAvailability(orderData.cafeteria_id)
    
    // 6. Get cafeteria settings for auto-acceptance
    const { data: settings } = await supabase
      .from('cafeteria_settings')
      .select('auto_accept_orders, estimated_prep_time')
      .eq('cafeteria_id', orderData.cafeteria_id)
      .single()
    
    // 7. Auto-accept if enabled
    let estimatedReadyTime: string | undefined
    if (settings?.auto_accept_orders) {
      const prepTime = settings.estimated_prep_time || 15
      const readyTime = new Date(Date.now() + prepTime * 60 * 1000)
      estimatedReadyTime = readyTime.toISOString()
      
      await supabase
        .from('orders')
        .update({
          status: 'preparing',
          preparation_started_at: new Date().toISOString()
        })
        .eq('id', order.id)
    }
    
    // 8. Send notifications
    await sendOrderNotifications({
      type: 'new_order',
      orderId: order.id,
      cafeteriaId: orderData.cafeteria_id,
      userId: orderData.user_id,
      message: `New order #${order.id.slice(-8)} received`,
      data: {
        orderAmount: orderData.total_amount,
        itemCount: orderData.order_items.length,
        autoAccepted: settings?.auto_accept_orders || false,
        estimatedReadyTime
      }
    })
    
    // 9. Log order creation
    await logUserActivity(
      orderData.user_id,
      'order_created',
      'order',
      order.id,
      {
        cafeteria_id: orderData.cafeteria_id,
        total_amount: orderData.total_amount,
        item_count: orderData.order_items.length,
        auto_accepted: settings?.auto_accept_orders || false
      }
    )
    
    return {
      success: true,
      orderId: order.id,
      transactionId: transaction.id,
      message: settings?.auto_accept_orders 
        ? 'Order placed and automatically accepted'
        : 'Order placed successfully',
      estimatedReadyTime
    }
    
  } catch (error) {
    console.error('Error processing new order:', error)
    return {
      success: false,
      orderId: '',
      message: 'Failed to process order',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

// Update order status with automation
export const updateOrderStatus = async (
  orderId: string,
  newStatus: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled',
  userId?: string
): Promise<boolean> => {
  try {
    // Get current order
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        cafeterias(name, owner_id),
        profiles(full_name)
      `)
      .eq('id', orderId)
      .single()
    
    if (!order) return false
    
    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }
    
    // Add timestamps based on status
    switch (newStatus) {
      case 'preparing':
        updateData.preparation_started_at = new Date().toISOString()
        break
      case 'ready':
        updateData.ready_at = new Date().toISOString()
        break
      case 'completed':
        updateData.completed_at = new Date().toISOString()
        // Process the financial transaction
        const { data: transaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('order_id', orderId)
          .single()
        
        if (transaction) {
          await supabase
            .from('transactions')
            .update({
              status: 'processed',
              processed_at: new Date().toISOString()
            })
            .eq('id', transaction.id)
        }
        break
      case 'cancelled':
        updateData.cancelled_at = new Date().toISOString()
        // Mark transaction as failed
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('order_id', orderId)
        break
    }
    
    // Update order
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
    
    if (error) throw error
    
    // Send notifications
    await sendOrderNotifications({
      type: 'status_update',
      orderId,
      cafeteriaId: order.cafeteria_id,
      userId: order.user_id,
      message: getStatusUpdateMessage(newStatus, order.cafeterias?.name || 'Cafeteria'),
      data: {
        previousStatus: order.status,
        newStatus,
        updatedBy: userId
      }
    })
    
    // Log status update
    await logUserActivity(
      userId || order.cafeterias?.owner_id,
      'order_status_updated',
      'order',
      orderId,
      {
        previous_status: order.status,
        new_status: newStatus,
        cafeteria_id: order.cafeteria_id
      }
    )
    
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}

// Send order notifications to relevant parties
const sendOrderNotifications = async (notification: OrderNotification): Promise<void> => {
  try {
    const { orderId, cafeteriaId, userId, type, message, data } = notification
    
    // Get cafeteria owner
    const { data: cafeteria } = await supabase
      .from('cafeterias')
      .select('owner_id, name')
      .eq('id', cafeteriaId)
      .single()
    
    // Notification priorities and recipients
    const notifications: Array<{
      userId: string
      title: string
      message: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
    }> = []
    
    switch (type) {
      case 'new_order':
        // Notify cafeteria owner
        if (cafeteria?.owner_id) {
          notifications.push({
            userId: cafeteria.owner_id,
            title: 'New Order Received',
            message: `New order #${orderId.slice(-8)} from customer`,
            priority: 'high'
          })
        }
        
        // Notify customer
        notifications.push({
          userId,
          title: 'Order Confirmed',
          message: `Your order has been placed at ${cafeteria?.name || 'the cafeteria'}`,
          priority: 'medium'
        })
        break
        
      case 'status_update':
        // Notify customer of status changes
        notifications.push({
          userId,
          title: 'Order Update',
          message,
          priority: data?.newStatus === 'ready' ? 'high' : 'medium'
        })
        break
        
      case 'ready_for_pickup':
        // High priority notification for pickup
        notifications.push({
          userId,
          title: 'Order Ready for Pickup',
          message: `Your order #${orderId.slice(-8)} is ready for pickup at ${cafeteria?.name}`,
          priority: 'urgent'
        })
        break
    }
    
    // Send all notifications
    for (const notif of notifications) {
      await createSystemNotification(
        notif.userId,
        'order',
        notif.title,
        notif.message,
        {
          orderId,
          cafeteriaId,
          type,
          ...data
        },
        notif.priority
      )
    }
    
  } catch (error) {
    console.error('Error sending order notifications:', error)
  }
}

// Get status update message
const getStatusUpdateMessage = (status: string, cafeteriaName: string): string => {
  switch (status) {
    case 'preparing':
      return `Your order is now being prepared at ${cafeteriaName}`
    case 'ready':
      return `Your order is ready for pickup at ${cafeteriaName}`
    case 'completed':
      return `Your order has been completed. Thank you for choosing ${cafeteriaName}!`
    case 'cancelled':
      return `Your order has been cancelled. Please contact ${cafeteriaName} for details.`
    default:
      return `Your order status has been updated`
  }
}

// Auto-process orders based on time (for scheduled tasks)
export const autoProcessOrders = async (): Promise<void> => {
  try {
    // Get orders that need automatic processing
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        cafeteria_settings(auto_accept_orders, estimated_prep_time)
      `)
      .eq('status', 'new')
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Orders older than 5 minutes
    
    for (const order of orders || []) {
      const settings = order.cafeteria_settings
      
      if (settings?.auto_accept_orders) {
        await updateOrderStatus(order.id, 'preparing')
      }
    }
    
    // Auto-mark orders as ready based on estimated prep time
    const { data: preparingOrders } = await supabase
      .from('orders')
      .select(`
        *,
        cafeteria_settings(estimated_prep_time)
      `)
      .eq('status', 'preparing')
      .not('preparation_started_at', 'is', null)
    
    for (const order of preparingOrders || []) {
      const prepTime = order.cafeteria_settings?.estimated_prep_time || 15
      const readyTime = new Date(order.preparation_started_at)
      readyTime.setMinutes(readyTime.getMinutes() + prepTime)
      
      if (new Date() >= readyTime) {
        await updateOrderStatus(order.id, 'ready')
      }
    }
    
  } catch (error) {
    console.error('Error in auto-process orders:', error)
  }
}

// Get order processing analytics
export const getOrderProcessingAnalytics = async (
  cafeteriaId?: string,
  timeRange: number = 30
) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)
    
    let query = supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
    
    if (cafeteriaId) {
      query = query.eq('cafeteria_id', cafeteriaId)
    }
    
    const { data: orders } = await query
    
    if (!orders) return null
    
    // Calculate processing metrics
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.status === 'completed')
    const cancelledOrders = orders.filter(o => o.status === 'cancelled')
    
    // Average processing times
    const processingTimes = completedOrders
      .filter(o => o.preparation_started_at && o.ready_at)
      .map(o => {
        const start = new Date(o.preparation_started_at!).getTime()
        const ready = new Date(o.ready_at!).getTime()
        return (ready - start) / (1000 * 60) // minutes
      })
    
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0
    
    // Order completion rate
    const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
    
    // Peak processing hours
    const hourlyData = orders.reduce((acc, order) => {
      const hour = new Date(order.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    return {
      totalOrders,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      completionRate,
      averageProcessingTime,
      peakHours: Object.entries(hourlyData)
        .map(([hour, count]) => ({ hour: parseInt(hour), orders: count }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5)
    }
    
  } catch (error) {
    console.error('Error getting order processing analytics:', error)
    return null
  }
}
