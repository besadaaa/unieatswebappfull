import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Orders API called')
    const supabase = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('📊 API params:', { status, limit })

    // Get orders - simple query first
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by status if specified (simplified)
    if (status && status !== 'all') {
      ordersQuery = ordersQuery.eq('status', status)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    console.log('📦 Raw orders from DB:', orders?.length || 0, 'orders')
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders found')
      return NextResponse.json({
        success: true,
        orders: [],
        total: 0,
        counts: { active: 0, completed: 0, cancelled: 0 }
      })
    }

    // Simple transformation without complex joins for now
    console.log('🔄 Processing', orders.length, 'orders')

    const processedOrders = orders.map(order => {
      // Determine status category
      let statusCategory = 'active'
      const statusLower = order.status?.toLowerCase() || ''

      if (['completed', 'delivered'].includes(statusLower)) {
        statusCategory = 'completed'
      } else if (['cancelled', 'canceled'].includes(statusLower)) {
        statusCategory = 'cancelled'
      }

      return {
        id: order.id,
        orderId: order.id,
        orderNumber: order.id.slice(0, 8),
        customer: {
          id: order.user_id,
          name: 'Customer',
          email: 'customer@example.com',
          phone: 'N/A',
          image: "/diverse-group-city.png"
        },
        cafeteria: {
          id: order.cafeteria_id,
          name: 'Cafeteria',
          location: 'Location'
        },
        items: 1,
        total: parseFloat(order.total_amount || '0'),
        totalFormatted: `${parseFloat(order.total_amount || '0').toFixed(2)} EGP`,
        status: {
          raw: order.status,
          label: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown',
          color: statusCategory === 'completed' ? 'green' : statusCategory === 'cancelled' ? 'red' : 'yellow',
          category: statusCategory
        },
        time: new Date(order.created_at).toLocaleDateString(),
        createdAt: order.created_at,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        platform: 'web',
        isPickedUp: statusCategory === 'completed'
      }
    })

    // Calculate simple counts
    const counts = {
      active: processedOrders.filter(order => order.status.category === 'active').length,
      completed: processedOrders.filter(order => order.status.category === 'completed').length,
      cancelled: processedOrders.filter(order => order.status.category === 'cancelled').length
    }

    const response = {
      success: true,
      orders: processedOrders,
      total: processedOrders.length,
      counts,
      filter: status || 'all'
    }

    console.log('✅ Returning response:', {
      success: response.success,
      ordersCount: response.orders.length,
      total: response.total,
      counts: response.counts
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Error in orders API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
