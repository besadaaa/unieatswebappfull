"use client"

import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/supabase'

// Get orders from Supabase with related data
export async function getOrders(status?: string, cafeteriaId?: string): Promise<Order[]> {
  try {
    console.log('Fetching orders with status:', status, 'cafeteriaId:', cafeteriaId)

    let query = supabase
      .from('orders')
      .select(`
        *,
        student:profiles!orders_student_id_fkey(*),
        cafeterias!orders_cafeteria_id_fkey(*),
        order_items(
          *,
          menu_items(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (cafeteriaId) {
      query = query.eq('cafeteria_id', cafeteriaId)
    }

    if (status && status !== "all") {
      // Map web app status to database status
      const dbStatus = status === 'new' ? 'pending' : status
      query = query.eq('status', dbStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('Successfully fetched orders:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching orders:', error)
    return []
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    console.log(`Updating order ${id} status to ${status}`)

    // Validate inputs
    if (!id || !status) {
      return { success: false, message: 'Order ID and status are required' }
    }

    // Test Supabase connection first
    console.log('Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('Supabase connection test failed:', testError)
      return { success: false, message: 'Database connection failed' }
    }
    console.log('Supabase connection test successful')

    // First, let's verify the order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status, student_id, cafeteria_id')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('Error checking if order exists:', JSON.stringify(checkError, null, 2))
      return { success: false, message: checkError.message || 'Order not found' }
    }

    console.log('Existing order found:', existingOrder)

    // Prepare update data with status and timestamps
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add specific timestamps for certain statuses (these columns exist in the database)
    if (status === 'preparing') {
      updateData.preparation_started_at = new Date().toISOString()
    } else if (status === 'ready') {
      updateData.ready_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.is_picked_up = true
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    console.log('Update data:', updateData)
    console.log('Attempting to update order with ID:', id)

    // Step 1: Simple update first
    const { data: updateResult, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select('id, status, updated_at')

    if (updateError) {
      console.error('Error in simple update:', JSON.stringify(updateError, null, 2))
      console.error('Update error details:', {
        message: updateError.message || 'No message',
        details: updateError.details || 'No details',
        hint: updateError.hint || 'No hint',
        code: updateError.code || 'No code',
        full_error: JSON.stringify(updateError)
      })
      return { success: false, message: updateError.message || 'Update failed' }
    }

    console.log('Update successful! Result:', updateResult)

    // Return success immediately - the update worked
    return {
      success: true,
      message: `Order status successfully updated to ${status}`,
      orderId: id,
      newStatus: status
    }

  } catch (error) {
    console.error('Unexpected error in updateOrderStatus:', error)
    console.error('Error type:', typeof error)
    console.error('Error string:', String(error))
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function getOrderDetails(id: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        student:profiles!orders_student_id_fkey(*),
        cafeterias!orders_cafeteria_id_fkey(*),
        order_items(
          *,
          menu_items(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching order details:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching order details:', error)
    return null
  }
}

// Create a new order
export async function createOrder(orderData: {
  cafeteria_id: string
  user_id: string
  total_amount: number
  order_items: Array<{
    menu_item_id: string
    quantity: number
    price: number
  }>
}) {
  try {
    // Calculate revenue breakdown
    const subtotal = orderData.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Revenue calculations: 4% service fee (capped at 20), 10% commission
    const userServiceFee = Math.min(subtotal * 0.04, 20.00)
    const cafeteriaCommission = subtotal * 0.10
    const adminRevenue = userServiceFee + cafeteriaCommission
    const totalAmount = subtotal + userServiceFee

    console.log('Order revenue calculation:', {
      subtotal,
      userServiceFee,
      cafeteriaCommission,
      adminRevenue,
      totalAmount,
      providedTotal: orderData.total_amount
    })

    // Create the order with all revenue fields
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        cafeteria_id: orderData.cafeteria_id,
        user_id: orderData.user_id,
        student_id: orderData.user_id, // For compatibility
        subtotal: subtotal,
        user_service_fee: userServiceFee,
        cafeteria_commission: cafeteriaCommission,
        admin_revenue: adminRevenue,
        total_amount: totalAmount,
        status: 'new',
        platform: 'web',
        service_fee_percentage: 4.0,
        payment_method: 'card'
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return { success: false, message: orderError.message }
    }

    // Create order items
    const orderItems = orderData.order_items.map(item => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id)
      return { success: false, message: itemsError.message }
    }

    return { success: true, message: "Order created successfully", data: order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
