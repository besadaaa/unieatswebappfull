import { supabase } from './supabase'

export interface OptimizedOrder {
  id: string
  customer_name: string
  customer_id: string
  total_amount: number
  status: string
  created_at: string
  pickup_time?: string
  item_count: number
  items_summary: string
  cafeteria_id: string
}

export interface OrderDetails extends OptimizedOrder {
  order_items: Array<{
    id: string
    menu_item_id: string
    menu_item_name: string
    quantity: number
    price: number
    total: number
  }>
  customer_details: {
    full_name: string
    email?: string
    phone?: string
  }
}

export class OptimizedOrdersService {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static readonly CACHE_DURATION = 30000 // 30 seconds

  // Get cached data if still valid
  private static getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  // Set cache data
  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Get orders with minimal data for list view (FAST)
  static async getOrdersList(
    cafeteriaId: string, 
    status?: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<{ orders: OptimizedOrder[]; total: number }> {
    try {
      const cacheKey = `orders_list_${cafeteriaId}_${status}_${limit}_${offset}`
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        console.log('Returning cached orders list')
        return cached
      }

      console.log('Fetching optimized orders list...')
      
      // Build optimized query - only essential fields
      let query = supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          pickup_time,
          student_id,
          profiles!orders_student_id_fkey(full_name)
        `, { count: 'exact' })
        .eq('cafeteria_id', cafeteriaId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') {
        const dbStatus = status === 'new' ? 'pending' : status
        query = query.eq('status', dbStatus)
      }

      const { data: orders, error, count } = await query

      if (error) {
        console.error('Error fetching orders list:', error)
        return { orders: [], total: 0 }
      }

      // Get order items count and summary in a separate optimized query
      const orderIds = orders?.map(o => o.id) || []
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select(`
          order_id,
          quantity,
          menu_items(name)
        `)
        .in('order_id', orderIds)

      // Process and optimize the data
      const optimizedOrders: OptimizedOrder[] = (orders || []).map(order => {
        const orderItems = orderItemsData?.filter(item => item.order_id === order.id) || []
        const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const itemsSummary = orderItems
          .map(item => `${item.quantity}x ${item.menu_items?.name || 'Unknown'}`)
          .slice(0, 3) // Only show first 3 items
          .join(', ') + (orderItems.length > 3 ? '...' : '')

        return {
          id: order.id,
          customer_name: order.profiles?.full_name || 'Unknown Customer',
          customer_id: order.student_id,
          total_amount: order.total_amount || 0,
          status: order.status === 'pending' ? 'new' : order.status,
          created_at: order.created_at,
          pickup_time: order.pickup_time,
          item_count: itemCount,
          items_summary: itemsSummary,
          cafeteria_id: cafeteriaId
        }
      })

      const result = { orders: optimizedOrders, total: count || 0 }
      this.setCachedData(cacheKey, result)
      
      console.log(`Fetched ${optimizedOrders.length} orders in optimized format`)
      return result

    } catch (error) {
      console.error('Error in getOrdersList:', error)
      return { orders: [], total: 0 }
    }
  }

  // Get full order details (only when needed)
  static async getOrderDetails(orderId: string): Promise<OrderDetails | null> {
    try {
      const cacheKey = `order_details_${orderId}`
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        console.log('Returning cached order details')
        return cached
      }

      console.log('Fetching full order details for:', orderId)

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_student_id_fkey(full_name, email, phone),
          order_items(
            id,
            menu_item_id,
            quantity,
            price,
            menu_items(name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        console.error('Error fetching order details:', error)
        return null
      }

      const orderDetails: OrderDetails = {
        id: order.id,
        customer_name: order.profiles?.full_name || 'Unknown Customer',
        customer_id: order.student_id,
        total_amount: order.total_amount || 0,
        status: order.status === 'pending' ? 'new' : order.status,
        created_at: order.created_at,
        pickup_time: order.pickup_time,
        item_count: order.order_items?.length || 0,
        items_summary: order.order_items?.map((item: any) => 
          `${item.quantity}x ${item.menu_items?.name || 'Unknown'}`
        ).join(', ') || '',
        cafeteria_id: order.cafeteria_id,
        order_items: order.order_items?.map((item: any) => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        })) || [],
        customer_details: {
          full_name: order.profiles?.full_name || 'Unknown Customer',
          email: order.profiles?.email,
          phone: order.profiles?.phone
        }
      }

      this.setCachedData(cacheKey, orderDetails)
      return orderDetails

    } catch (error) {
      console.error('Error in getOrderDetails:', error)
      return null
    }
  }

  // Update order status (optimized)
  static async updateOrderStatus(orderId: string, newStatus: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      console.log(`Updating order ${orderId} to status ${newStatus}`)

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Add status-specific timestamps
      if (newStatus === 'preparing') {
        updateData.preparation_started_at = new Date().toISOString()
      } else if (newStatus === 'ready') {
        updateData.ready_at = new Date().toISOString()
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.is_picked_up = true
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        return { success: false, message: error.message }
      }

      // Clear relevant caches
      this.clearOrderCaches(orderId)

      return {
        success: true,
        message: `Order status updated to ${newStatus}`
      }

    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      return { success: false, message: 'Failed to update order status' }
    }
  }

  // Get orders count by status (for tabs)
  static async getOrdersCounts(cafeteriaId: string): Promise<{
    new: number
    preparing: number
    ready: number
    completed: number
    cancelled: number
    total: number
  }> {
    try {
      const cacheKey = `orders_counts_${cafeteriaId}`
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        return cached
      }

      console.log('Fetching orders counts...')

      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('cafeteria_id', cafeteriaId)

      if (error) {
        console.error('Error fetching orders counts:', error)
        return { new: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0, total: 0 }
      }

      const counts = {
        new: data?.filter(o => o.status === 'pending').length || 0,
        preparing: data?.filter(o => o.status === 'preparing').length || 0,
        ready: data?.filter(o => o.status === 'ready').length || 0,
        completed: data?.filter(o => o.status === 'completed').length || 0,
        cancelled: data?.filter(o => o.status === 'cancelled').length || 0,
        total: data?.length || 0
      }

      this.setCachedData(cacheKey, counts)
      return counts

    } catch (error) {
      console.error('Error in getOrdersCounts:', error)
      return { new: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0, total: 0 }
    }
  }

  // Clear caches for a specific order
  private static clearOrderCaches(orderId: string): void {
    const keysToDelete: string[] = []
    
    for (const [key] of this.cache) {
      if (key.includes(orderId) || key.includes('orders_list') || key.includes('orders_counts')) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    console.log(`Cleared ${keysToDelete.length} cache entries`)
  }

  // Clear all caches
  static clearAllCaches(): void {
    this.cache.clear()
    console.log('Cleared all order caches')
  }

  // Subscribe to real-time order updates
  static subscribeToOrderUpdates(cafeteriaId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`orders_${cafeteriaId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `cafeteria_id=eq.${cafeteriaId}`
        }, 
        (payload) => {
          console.log('Real-time order update:', payload)
          this.clearAllCaches() // Clear caches on real-time updates
          callback(payload)
        }
      )
      .subscribe()
  }
}
