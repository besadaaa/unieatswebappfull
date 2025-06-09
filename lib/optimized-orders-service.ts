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

      console.log('Fetching optimized orders list from Supabase...')
      
      // Build optimized query - only essential fields
      let query = supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          pickup_time,
          user_id,
          student_id,
          cafeteria_id
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



      // Get order items count and summary using API to bypass RLS
      const orderIds = orders?.map(o => o.id) || []
      let orderItemsData: any[] = []

      if (orderIds.length > 0) {
        try {
          const response = await fetch('/api/order-items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderIds })
          })

          if (response.ok) {
            const result = await response.json()
            orderItemsData = result.orderItems || []
          } else {
            console.error('Failed to fetch order items via API:', response.status)
            orderItemsData = []
          }
        } catch (error) {
          console.error('Error fetching order items via API:', error)
          orderItemsData = []
        }
      }

      // Get customer names using API to bypass RLS issues
      const userIds = orders?.map(o => o.user_id || o.student_id).filter(Boolean) || []
      console.log('User IDs to fetch profiles for:', userIds)

      let profilesData: any[] = []
      if (userIds.length > 0) {
        try {
          console.log('🔥 Calling customer API for orders list with userIds:', userIds)

          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds })
          })

          console.log('Customer API response status for orders list:', response.status)

          if (response.ok) {
            const result = await response.json()
            console.log('Customer API response for orders list:', result)

            // Handle both old and new response formats
            profilesData = result.profiles || result || []
            console.log('Profiles data fetched via API:', profilesData)
          } else {
            const errorText = await response.text()
            console.error('Failed to fetch profiles via API:', response.status, errorText)

            // Create fallback profiles
            profilesData = userIds.map(userId => ({
              id: userId,
              full_name: `User ${userId.slice(0, 8)}`,
              email: null,
              phone: null
            }))
          }
        } catch (error) {
          console.error('Error fetching profiles via API:', error)

          // Create fallback profiles
          profilesData = userIds.map(userId => ({
            id: userId,
            full_name: `User ${userId.slice(0, 8)}`,
            email: null,
            phone: null
          }))
        }
      }

      // Process and optimize the data
      const optimizedOrders: OptimizedOrder[] = (orders || []).map(order => {
        const orderItems = orderItemsData?.filter(item => item.order_id === order.id) || []
        const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const itemsSummary = orderItems
          .map(item => `${item.quantity}x ${item.menu_items?.name || 'Unknown'}`)
          .slice(0, 3) // Only show first 3 items
          .join(', ') + (orderItems.length > 3 ? '...' : '')

        // Find customer name from separately fetched profiles
        const customerId = order.user_id || order.student_id
        const customerProfile = profilesData?.find(profile => profile.id === customerId)
        const customerName = customerProfile?.full_name || customerProfile?.email || `User ${customerId?.slice(0, 8)}` || 'Unknown Customer'

        console.log(`Order ${order.id}: customerId=${customerId}, profile found=${!!customerProfile}, name=${customerName}`)

        // Check if any order items have notes (using selected_variant field)
        const hasNotes = orderItems.some(item =>
          item.selected_variant && item.selected_variant.trim().length > 0
        )

        return {
          id: order.id,
          customer_name: customerName,
          customer_id: order.student_id || order.user_id,
          total_amount: order.total_amount || 0,
          status: order.status === 'pending' ? 'new' : order.status,
          created_at: order.created_at,
          pickup_time: order.pickup_time,
          item_count: itemCount,
          items_summary: itemsSummary,
          cafeteria_id: cafeteriaId,
          has_notes: hasNotes
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

      console.log('Fetching full order details from Supabase for:', orderId)

      // First, let's try to get the order without the problematic join
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        console.error('Error fetching order:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return null
      }

      // Get order items using API to bypass RLS
      let orderItems: any[] = []

      try {
        console.log('Fetching order items for order:', orderId)

        const response = await fetch(`/api/order-items?orderId=${orderId}`)

        if (response.ok) {
          const result = await response.json()
          orderItems = result.orderItems || []
          console.log('Order items fetched via API:', orderItems.length)
        } else {
          console.error('Failed to fetch order items via API:', response.status)
          orderItems = []
        }
      } catch (error) {
        console.error('Error fetching order items via API:', error)
        orderItems = []
      }

      if (!order) {
        console.error('No order data returned for ID:', orderId)
        return null
      }

      // Fetch customer details using API to avoid RLS issues
      let customerDetails = { full_name: 'Unknown Customer', email: null, phone: null }
      const customerId = order.user_id || order.student_id

      if (customerId) {
        console.log('Fetching profile for customer ID:', customerId)
        try {
          console.log('🔥 Calling customer API for order details with customerId:', customerId)

          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: [customerId] })
          })

          console.log('Customer API response status for order details:', response.status)

          if (response.ok) {
            const result = await response.json()
            console.log('Customer API response for order details:', result)

            // Handle both old and new response formats
            const profiles = result.profiles || result || []
            const profile = profiles[0]

            if (profile) {
              customerDetails = {
                full_name: profile.full_name || `User ${customerId.slice(0, 8)}`,
                email: profile.email || null,
                phone: profile.phone || null
              }
              console.log('Customer profile found via API for order details:', profile)
            } else {
              console.log('No profile found for customer ID:', customerId)
              // Fallback to partial customer ID if no profile
              customerDetails.full_name = `User ${customerId.slice(0, 8)}`
            }
          } else {
            const errorText = await response.text()
            console.error('Failed to fetch customer profile via API:', response.status, errorText)
            customerDetails.full_name = `User ${customerId.slice(0, 8)}`
          }
        } catch (error) {
          console.error('Error fetching customer profile via API for order details:', error)
          customerDetails.full_name = `User ${customerId.slice(0, 8)}`
        }
      }

      // Check if any order items have notes (using selected_variant field)
      const hasNotes = orderItems?.some((item: any) =>
        item.selected_variant && item.selected_variant.trim().length > 0
      ) || false

      const orderDetails: OrderDetails = {
        id: order.id,
        customer_name: customerDetails.full_name,
        customer_id: order.student_id || order.user_id,
        total_amount: order.total_amount || 0,
        status: order.status === 'pending' ? 'new' : order.status,
        created_at: order.created_at,
        pickup_time: order.pickup_time,
        item_count: orderItems?.length || 0,
        items_summary: orderItems?.map((item: any) =>
          `${item.quantity}x ${item.menu_items?.name || 'Unknown'}`
        ).join(', ') || '',
        cafeteria_id: order.cafeteria_id,
        has_notes: hasNotes,
        order_items: orderItems?.map((item: any) => ({
          id: item.id || 'unknown',
          menu_item_id: item.item_id || 'unknown',
          menu_item_name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity || 0,
          price: item.price || 0,
          total: (item.quantity || 0) * (item.price || 0),
          notes: item.selected_variant || undefined
        })) || [],
        customer_details: customerDetails
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

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('User not authenticated:', authError)
        return { success: false, message: 'User not authenticated' }
      }

      console.log('Authenticated user:', user.id)

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Add status-specific timestamps
      if (newStatus === 'preparing') {
        updateData.preparation_started_at = new Date().toISOString()
        console.log('Setting preparation_started_at:', updateData.preparation_started_at)
      } else if (newStatus === 'ready') {
        updateData.ready_at = new Date().toISOString()
        console.log('Setting ready_at:', updateData.ready_at)
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.is_picked_up = true
        console.log('Setting completed_at:', updateData.completed_at)
        console.log('Setting is_picked_up:', updateData.is_picked_up)
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        console.log('Setting cancelled_at:', updateData.cancelled_at)
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()

      if (error) {
        console.error('Error updating order status:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return { success: false, message: error.message || 'Failed to update order status' }
      }

      if (!data || data.length === 0) {
        console.error('No order found with ID:', orderId)
        return { success: false, message: 'Order not found or access denied' }
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

  // Track active subscriptions to prevent duplicates
  private static activeSubscriptions = new Map<string, any>()

  // Subscribe to real-time order updates
  static subscribeToOrderUpdates(cafeteriaId: string, callback: (payload: any) => void) {
    const channelName = `orders_${cafeteriaId}`

    // If there's already an active subscription for this cafeteria, unsubscribe first
    if (this.activeSubscriptions.has(channelName)) {
      console.log(`Unsubscribing existing channel: ${channelName}`)
      const existingChannel = this.activeSubscriptions.get(channelName)
      supabase.removeChannel(existingChannel)
      this.activeSubscriptions.delete(channelName)
    }

    console.log(`Creating new subscription for channel: ${channelName}`)
    const channel = supabase
      .channel(channelName)
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

    // Store the channel reference
    this.activeSubscriptions.set(channelName, channel)

    return {
      unsubscribe: () => {
        console.log(`Unsubscribing from channel: ${channelName}`)
        supabase.removeChannel(channel)
        this.activeSubscriptions.delete(channelName)
      }
    }
  }

  // Clean up all subscriptions
  static unsubscribeAll() {
    console.log('Unsubscribing from all order channels...')
    this.activeSubscriptions.forEach((channel, channelName) => {
      console.log(`Removing channel: ${channelName}`)
      supabase.removeChannel(channel)
    })
    this.activeSubscriptions.clear()
  }
}
