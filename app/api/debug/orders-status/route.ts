import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Get all orders with detailed information
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        admin_revenue,
        cafeteria_revenue,
        created_at,
        completed_at,
        cancelled_at,
        cafeteria_id,
        user_id,
        cafeterias(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Group orders by status
    const ordersByStatus = orders?.reduce((acc: any, order: any) => {
      const status = order.status || 'unknown'
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push({
        id: order.id,
        total_amount: order.total_amount,
        admin_revenue: order.admin_revenue,
        cafeteria_revenue: order.cafeteria_revenue,
        created_at: order.created_at,
        completed_at: order.completed_at,
        cancelled_at: order.cancelled_at,
        cafeteria: order.cafeterias?.name,
        cafeteria_id: order.cafeteria_id
      })
      return acc
    }, {}) || {}

    // Calculate metrics by status
    const statusSummary = Object.keys(ordersByStatus).map(status => {
      const statusOrders = ordersByStatus[status]
      const totalAmount = statusOrders.reduce((sum: number, order: any) => 
        sum + (parseFloat(order.total_amount) || 0), 0)
      const totalRevenue = statusOrders.reduce((sum: number, order: any) => 
        sum + (parseFloat(order.admin_revenue) || 0), 0)
      
      return {
        status,
        count: statusOrders.length,
        totalAmount,
        totalRevenue,
        orders: statusOrders
      }
    })

    // Get orders that should count for metrics (exclude ALL cancelled orders)
    const metricsOrders = orders?.filter(order =>
      order.status !== 'cancelled'
    ) || []

    const totalMetricsAmount = metricsOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0)
    const totalMetricsRevenue = metricsOrders.reduce((sum, order) => 
      sum + (parseFloat(order.admin_revenue) || 0), 0)

    console.log('📊 Orders Status Debug:', {
      totalOrders: orders?.length || 0,
      ordersByStatus: Object.keys(ordersByStatus).map(status => ({
        status,
        count: ordersByStatus[status].length
      })),
      metricsOrders: metricsOrders.length,
      totalMetricsAmount,
      totalMetricsRevenue
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalOrders: orders?.length || 0,
        metricsOrders: metricsOrders.length,
        totalMetricsAmount,
        totalMetricsRevenue
      },
      ordersByStatus: statusSummary,
      metricsOrders: metricsOrders.map(order => ({
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        admin_revenue: order.admin_revenue,
        created_at: order.created_at,
        completed_at: order.completed_at,
        cafeteria: order.cafeterias?.name
      }))
    })

  } catch (error) {
    console.error('Error in orders status debug:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
