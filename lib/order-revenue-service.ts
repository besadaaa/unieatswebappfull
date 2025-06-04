import { supabase } from './supabase'

export interface OrderItem {
  menu_item_id: string
  quantity: number
  price: number
  notes?: string
}

export interface OrderRevenueCalculation {
  subtotal: number
  userServiceFee: number
  cafeteriaCommission: number
  adminRevenue: number
  totalAmount: number
  serviceFeePercentage: number
}

export interface CreateOrderData {
  user_id: string
  cafeteria_id: string
  order_items: OrderItem[]
  pickup_time?: string
  payment_method?: string
  platform?: string
}

export class OrderRevenueService {
  /**
   * Calculate revenue breakdown for an order
   */
  static calculateRevenue(orderItems: OrderItem[]): OrderRevenueCalculation {
    // Calculate subtotal from order items
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // Revenue model: 4% service fee (capped at 20 EGP) + 10% commission
    const serviceFeeRate = 0.04 // 4%
    const maxServiceFee = 20.00 // 20 EGP cap
    const commissionRate = 0.10 // 10%

    // Calculate fees
    const userServiceFee = Math.min(subtotal * serviceFeeRate, maxServiceFee)
    const cafeteriaCommission = subtotal * commissionRate
    const adminRevenue = userServiceFee + cafeteriaCommission
    const totalAmount = subtotal + userServiceFee

    return {
      subtotal,
      userServiceFee,
      cafeteriaCommission,
      adminRevenue,
      totalAmount,
      serviceFeePercentage: serviceFeeRate * 100
    }
  }

  /**
   * Create order with proper revenue calculations saved to Supabase
   */
  static async createOrderWithRevenue(orderData: CreateOrderData) {
    try {
      console.log('Creating order with revenue calculations:', orderData)

      // Calculate revenue breakdown
      const revenue = this.calculateRevenue(orderData.order_items)
      
      console.log('Revenue breakdown:', revenue)

      // Create the order with all revenue fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.user_id,
          cafeteria_id: orderData.cafeteria_id,
          student_id: orderData.user_id, // For compatibility
          subtotal: revenue.subtotal,
          user_service_fee: revenue.userServiceFee,
          cafeteria_commission: revenue.cafeteriaCommission,
          admin_revenue: revenue.adminRevenue,
          total_amount: revenue.totalAmount,
          service_fee_percentage: revenue.serviceFeePercentage,
          status: 'pending',
          pickup_time: orderData.pickup_time,
          payment_method: orderData.payment_method || 'card',
          platform: orderData.platform || 'web',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
      }

      console.log('Order created successfully:', order.id)

      // Create order items
      const orderItems = orderData.order_items.map(item => ({
        order_id: order.id,
        item_id: item.menu_item_id, // Use item_id to match database schema
        quantity: item.quantity,
        price: item.price,
        selected_variant: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Try to clean up the order if items creation failed
        await supabase.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      console.log('Order items created successfully')

      // Return the complete order with revenue breakdown
      return {
        success: true,
        order: {
          ...order,
          order_items: orderItems
        },
        revenue
      }

    } catch (error) {
      console.error('Error in createOrderWithRevenue:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        order: null,
        revenue: null
      }
    }
  }

  /**
   * Update existing order with proper revenue calculations
   */
  static async updateOrderRevenue(orderId: string) {
    try {
      console.log('Updating order revenue for order:', orderId)

      // Get the order and its items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            item_id,
            quantity,
            price
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error('Error fetching order:', orderError)
        return { success: false, error: 'Order not found' }
      }

      // Calculate revenue from order items
      const orderItems = order.order_items.map((item: any) => ({
        menu_item_id: item.item_id,
        quantity: item.quantity,
        price: item.price
      }))

      const revenue = this.calculateRevenue(orderItems)

      // Update the order with calculated revenue
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          subtotal: revenue.subtotal,
          user_service_fee: revenue.userServiceFee,
          cafeteria_commission: revenue.cafeteriaCommission,
          admin_revenue: revenue.adminRevenue,
          total_amount: revenue.totalAmount,
          service_fee_percentage: revenue.serviceFeePercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating order revenue:', updateError)
        return { success: false, error: updateError.message }
      }

      console.log('Order revenue updated successfully:', orderId)

      return {
        success: true,
        order: updatedOrder,
        revenue
      }

    } catch (error) {
      console.error('Error in updateOrderRevenue:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Batch update all orders missing revenue calculations
   */
  static async fixAllOrdersRevenue() {
    try {
      console.log('Starting batch revenue fix for all orders...')

      // Get all orders that are missing revenue calculations
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          subtotal,
          user_service_fee,
          admin_revenue,
          order_items (
            item_id,
            quantity,
            price
          )
        `)
        .or('subtotal.is.null,user_service_fee.is.null,admin_revenue.is.null')

      if (ordersError) {
        console.error('Error fetching orders for revenue fix:', ordersError)
        return { success: false, error: ordersError.message }
      }

      console.log(`Found ${orders?.length || 0} orders needing revenue calculations`)

      let updatedCount = 0
      let errorCount = 0

      // Process each order
      for (const order of orders || []) {
        try {
          const result = await this.updateOrderRevenue(order.id)
          if (result.success) {
            updatedCount++
          } else {
            errorCount++
            console.error(`Failed to update order ${order.id}:`, result.error)
          }
        } catch (error) {
          errorCount++
          console.error(`Error processing order ${order.id}:`, error)
        }
      }

      console.log(`Batch revenue fix completed: ${updatedCount} updated, ${errorCount} errors`)

      return {
        success: true,
        totalOrders: orders?.length || 0,
        updatedCount,
        errorCount
      }

    } catch (error) {
      console.error('Error in fixAllOrdersRevenue:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get revenue summary for a specific time period
   */
  static async getRevenueSummary(startDate?: Date, endDate?: Date) {
    try {
      let query = supabase
        .from('orders')
        .select('subtotal, user_service_fee, cafeteria_commission, admin_revenue, total_amount, created_at')
        .not('admin_revenue', 'is', null)

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
      }

      const { data: orders, error } = await query

      if (error) {
        console.error('Error fetching revenue summary:', error)
        return { success: false, error: error.message }
      }

      const summary = {
        totalOrders: orders?.length || 0,
        totalSubtotal: orders?.reduce((sum, o) => sum + (parseFloat(o.subtotal) || 0), 0) || 0,
        totalServiceFees: orders?.reduce((sum, o) => sum + (parseFloat(o.user_service_fee) || 0), 0) || 0,
        totalCommissions: orders?.reduce((sum, o) => sum + (parseFloat(o.cafeteria_commission) || 0), 0) || 0,
        totalAdminRevenue: orders?.reduce((sum, o) => sum + (parseFloat(o.admin_revenue) || 0), 0) || 0,
        totalOrderValue: orders?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0
      }

      return {
        success: true,
        summary
      }

    } catch (error) {
      console.error('Error in getRevenueSummary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
