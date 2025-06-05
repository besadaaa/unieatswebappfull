import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { auditLogger, getClientIP, getUserAgent } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'completed', 'cancelled', or 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get orders with basic info
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by status if specified
    if (status && status !== 'all') {
      if (status === 'active') {
        ordersQuery = ordersQuery.in('status', ['pending', 'confirmed', 'preparing', 'ready', 'ready_for_pickup'])
      } else if (status === 'completed') {
        ordersQuery = ordersQuery.in('status', ['completed', 'delivered'])
      } else if (status === 'cancelled') {
        ordersQuery = ordersQuery.in('status', ['cancelled', 'canceled'])
      } else {
        ordersQuery = ordersQuery.eq('status', status)
      }
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        total: 0,
        counts: { active: 0, completed: 0, cancelled: 0 }
      })
    }

    // Get user IDs and cafeteria IDs for batch fetching
    const userIds = [...new Set(orders.map(order => order.user_id).filter(Boolean))]
    const cafeteriaIds = [...new Set(orders.map(order => order.cafeteria_id).filter(Boolean))]
    const orderIds = orders.map(order => order.id)

    // Fetch users/profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', userIds)

    // Fetch auth users for emails
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUsersMap = new Map(authUsers.users.map(user => [user.id, user]))

    // Fetch cafeterias
    const { data: cafeterias } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, location')
      .in('id', cafeteriaIds)

    // Fetch order items
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id, quantity, price')
      .in('order_id', orderIds)

    // Create lookup maps
    const profilesMap = new Map(profiles?.map(profile => [profile.id, profile]) || [])
    const cafeteriasMap = new Map(cafeterias?.map(cafeteria => [cafeteria.id, cafeteria]) || [])
    const orderItemsMap = new Map<string, any[]>()

    orderItems?.forEach(item => {
      if (!orderItemsMap.has(item.order_id)) {
        orderItemsMap.set(item.order_id, [])
      }
      orderItemsMap.get(item.order_id)?.push(item)
    })

    // Process orders
    const processedOrders = orders.map(order => {
      const profile = profilesMap.get(order.user_id)
      const authUser = authUsersMap.get(order.user_id)
      const cafeteria = cafeteriasMap.get(order.cafeteria_id)
      const items = orderItemsMap.get(order.id) || []

      // Calculate totals
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const calculatedTotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (parseFloat(item.price) || 0)), 0)
      const finalTotal = parseFloat(order.total_amount) || calculatedTotal

      // Format time
      const orderTime = new Date(order.created_at)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

      let timeString = ""
      if (diffInMinutes < 60) {
        timeString = `${diffInMinutes} mins ago`
      } else if (diffInMinutes < 1440) {
        timeString = `${Math.floor(diffInMinutes / 60)} hours ago`
      } else {
        timeString = orderTime.toLocaleDateString()
      }

      // Determine status category
      let statusCategory = 'active'
      const statusLower = order.status?.toLowerCase() || ''

      if (['completed', 'delivered'].includes(statusLower)) {
        statusCategory = 'completed'
      } else if (['cancelled', 'canceled'].includes(statusLower)) {
        statusCategory = 'cancelled'
      }

      // Format status for display
      let statusDisplay = order.status || 'Unknown'
      let statusColor = 'gray'

      switch (statusLower) {
        case 'pending':
          statusDisplay = 'Pending'
          statusColor = 'yellow'
          break
        case 'confirmed':
          statusDisplay = 'Confirmed'
          statusColor = 'blue'
          break
        case 'preparing':
          statusDisplay = 'Preparing'
          statusColor = 'blue'
          break
        case 'ready':
        case 'ready_for_pickup':
          statusDisplay = 'Ready for Pickup'
          statusColor = 'purple'
          break
        case 'completed':
        case 'delivered':
          statusDisplay = 'Completed'
          statusColor = 'green'
          break
        case 'cancelled':
        case 'canceled':
          statusDisplay = 'Cancelled'
          statusColor = 'red'
          break
      }

      return {
        id: order.order_number || order.id,
        orderId: order.id,
        orderNumber: order.order_number,
        customer: {
          id: order.user_id,
          name: profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown Customer',
          email: authUser?.email || 'No email',
          phone: profile?.phone || 'No phone',
          image: "/diverse-group-city.png"
        },
        cafeteria: {
          id: order.cafeteria_id,
          name: cafeteria?.name || 'Unknown Cafeteria',
          location: cafeteria?.location || 'Unknown Location'
        },
        items: totalItems,
        total: finalTotal,
        totalFormatted: `${finalTotal.toFixed(2)} EGP`,
        status: {
          raw: order.status,
          label: statusDisplay,
          color: statusColor,
          category: statusCategory
        },
        time: timeString,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        platform: order.platform || 'web',
        isPickedUp: order.is_picked_up || false,
        rating: order.rating,
        reviewComment: order.review_comment,
        cancellationReason: order.cancellation_reason
      }
    })

    // Calculate counts for all statuses
    const allOrdersForCounts = status === 'all' ? processedOrders : orders.map(order => ({
      status: { category:
        ['completed', 'delivered'].includes(order.status?.toLowerCase() || '') ? 'completed' :
        ['cancelled', 'canceled'].includes(order.status?.toLowerCase() || '') ? 'cancelled' : 'active'
      }
    }))

    const counts = {
      active: allOrdersForCounts.filter(order => order.status.category === 'active').length,
      completed: allOrdersForCounts.filter(order => order.status.category === 'completed').length,
      cancelled: allOrdersForCounts.filter(order => order.status.category === 'cancelled').length
    }

    // Log the data access for audit purposes
    await auditLogger.log({
      action: 'data_exported',
      details: `Accessed orders data - Status: ${status || 'all'}, Count: ${processedOrders.length}`,
      severity: 'low',
      category: 'general',
      ip_address: getClientIP(request),
      user_agent: getUserAgent(request),
      metadata: {
        endpoint: '/api/orders',
        filter: status || 'all',
        count: processedOrders.length
      }
    })

    return NextResponse.json({
      success: true,
      orders: processedOrders,
      total: processedOrders.length,
      counts,
      filter: status || 'all'
    })

  } catch (error) {
    console.error('Error in orders API:', error)

    // Log the error for audit purposes
    await auditLogger.logSecurity(
      'unauthorized_access',
      `Failed to access orders API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'medium'
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
