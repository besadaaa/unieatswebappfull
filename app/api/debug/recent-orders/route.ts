import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking recent orders and their statuses...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get recent orders for the current cafeteria
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        cafeteria_id,
        status,
        total_amount,
        created_at,
        platform,
        pickup_time,
        student_id
      `)
      .eq('cafeteria_id', 'c6000000-0000-0000-0000-000000000006')
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    console.log('📊 Recent Orders Debug:')
    console.log('Total orders found:', orders?.length || 0)

    // Group orders by status
    const ordersByStatus = orders?.reduce((acc, order) => {
      const status = order.status || 'no-status'
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(order)
      return acc
    }, {} as Record<string, any[]>) || {}

    console.log('📋 Orders by status:')
    Object.entries(ordersByStatus).forEach(([status, orders]) => {
      console.log(`  ${status}: ${orders.length} orders`)
      orders.forEach(order => {
        console.log(`    - Order ${order.id}: ${order.total_amount} EGP, ${order.created_at}, platform: ${order.platform}`)
      })
    })

    // Test the OptimizedOrdersService for each status
    const { OptimizedOrdersService } = await import('@/lib/optimized-orders-service')
    
    console.log('🔧 Testing OptimizedOrdersService...')
    
    const [newOrders, preparingOrders, readyOrders, completedOrders, cancelledOrders] = await Promise.all([
      OptimizedOrdersService.getOrdersList('c6000000-0000-0000-0000-000000000006', 'new', 10),
      OptimizedOrdersService.getOrdersList('c6000000-0000-0000-0000-000000000006', 'preparing', 10),
      OptimizedOrdersService.getOrdersList('c6000000-0000-0000-0000-000000000006', 'ready', 10),
      OptimizedOrdersService.getOrdersList('c6000000-0000-0000-0000-000000000006', 'completed', 10),
      OptimizedOrdersService.getOrdersList('c6000000-0000-0000-0000-000000000006', 'cancelled', 10)
    ])

    console.log('📊 OptimizedOrdersService Results:')
    console.log(`  New orders: ${newOrders.orders.length}`)
    console.log(`  Preparing orders: ${preparingOrders.orders.length}`)
    console.log(`  Ready orders: ${readyOrders.orders.length}`)
    console.log(`  Completed orders: ${completedOrders.orders.length}`)
    console.log(`  Cancelled orders: ${cancelledOrders.orders.length}`)

    return NextResponse.json({
      success: true,
      data: {
        rawOrders: orders || [],
        ordersByStatus,
        optimizedResults: {
          new: newOrders,
          preparing: preparingOrders,
          ready: readyOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        summary: {
          totalRawOrders: orders?.length || 0,
          statusBreakdown: Object.entries(ordersByStatus).map(([status, orders]) => ({
            status,
            count: orders.length
          }))
        }
      }
    })

  } catch (error) {
    console.error('Debug recent orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
