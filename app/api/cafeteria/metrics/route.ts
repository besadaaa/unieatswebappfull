import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const cafeteriaId = searchParams.get('cafeteriaId')
    const timeRange = searchParams.get('timeRange') || 'This Month'

    if (!cafeteriaId) {
      return NextResponse.json({ error: 'Cafeteria ID is required' }, { status: 400 })
    }

    console.log('🏪 Fetching cafeteria metrics for:', cafeteriaId, 'Time range:', timeRange)

    // Calculate date range based on timeRange using local timezone for accurate "today"
    const now = new Date()
    let startDateStr: string
    const endDateStr = now.toISOString()

    // Get today's date in local timezone (not UTC) to fix timezone issues
    const today = new Date()
    const todayStr = today.getFullYear() + '-' +
                    String(today.getMonth() + 1).padStart(2, '0') + '-' +
                    String(today.getDate()).padStart(2, '0')

    switch (timeRange) {
      case 'Today':
        startDateStr = todayStr + 'T00:00:00.000Z'
        break
      case 'This Week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startDateStr = startOfWeek.toISOString().split('T')[0] + 'T00:00:00.000Z'
        break
      case 'This Month':
        const year = now.getFullYear()
        const month = now.getMonth()
        startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`
        break
      case 'This Year':
        const currentYear = now.getFullYear()
        startDateStr = `${currentYear}-01-01T00:00:00.000Z`
        break
      default:
        const defaultYear = now.getFullYear()
        const defaultMonth = now.getMonth()
        startDateStr = `${defaultYear}-${String(defaultMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`
    }

    console.log('📅 Date range:', { startDateStr, endDateStr, todayStr })

    // Get all orders for the time range
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        subtotal,
        total_amount,
        admin_revenue,
        cafeteria_revenue,
        user_id,
        status,
        created_at,
        order_items (
          id,
          item_id,
          quantity,
          price,
          menu_items (
            id,
            name,
            category
          )
        )
      `)
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', startDateStr.split('T')[0])
      .lte('created_at', endDateStr.split('T')[0] + 'T23:59:59')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      throw ordersError
    }

    console.log('✅ Orders fetched:', orders?.length || 0)

    // Get today's orders specifically
    const { data: todayOrders, error: todayOrdersError } = await supabaseAdmin
      .from('orders')
      .select('id, subtotal, total_amount, admin_revenue, cafeteria_revenue, user_id, status')
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', todayStr + 'T00:00:00')
      .lte('created_at', todayStr + 'T23:59:59')

    if (todayOrdersError) {
      console.error('❌ Error fetching today orders:', todayOrdersError)
    }

    console.log('✅ Today orders fetched:', todayOrders?.length || 0)

    // Get menu items count
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, name')
      .eq('cafeteria_id', cafeteriaId)

    if (menuError) {
      console.error('❌ Error fetching menu items:', menuError)
    }

    console.log('✅ Menu items fetched:', menuItems?.length || 0)

    // Calculate metrics (exclude cancelled orders)
    const allOrders = (orders || []).filter(order => order.status !== 'cancelled')
    const todayOrdersList = (todayOrders || []).filter(order => order.status !== 'cancelled')

    // Time range metrics (main metrics based on selected time range)
    const totalOrders = allOrders.length
    const totalRevenue = allOrders.reduce((sum, order) => {
      // Use the actual cafeteria_revenue field from database
      // This field already contains the correct amount the cafeteria receives
      const cafeteriaRevenue = parseFloat(order.cafeteria_revenue) || 0
      return sum + cafeteriaRevenue
    }, 0)
    const totalCustomers = new Set(allOrders.map(order => order.user_id)).size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Today's metrics (separate for "today" specific data)
    const todayOrdersCount = todayOrdersList.length
    const todayRevenue = todayOrdersList.reduce((sum, order) => {
      // Use the actual cafeteria_revenue field from database
      // This field already contains the correct amount the cafeteria receives
      const cafeteriaRevenue = parseFloat(order.cafeteria_revenue) || 0

      console.log(`💰 Order calculation: Cafeteria revenue from DB: ${cafeteriaRevenue.toFixed(2)} EGP`)

      return sum + cafeteriaRevenue
    }, 0)
    const todayCustomers = new Set(todayOrdersList.map(order => order.user_id)).size

    // Calculate popular items
    const itemSales = new Map()
    allOrders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const menuItem = item.menu_items
        if (menuItem) {
          const key = menuItem.id
          const existing = itemSales.get(key) || {
            name: menuItem.name,
            category: menuItem.category,
            quantity: 0,
            revenue: 0
          }
          existing.quantity += item.quantity || 0

          // Calculate cafeteria revenue for this item
          // item.price is the original cafeteria price (what they set)
          // We need to calculate what the cafeteria actually gets (90% of original price)
          const itemTotalPrice = (parseFloat(item.price) || 0) * (item.quantity || 0)
          const cafeteriaItemRevenue = itemTotalPrice * 0.9  // Cafeteria gets 90% of their original price
          existing.revenue += cafeteriaItemRevenue

          itemSales.set(key, existing)
        }
      })
    })

    // Get top 5 popular items
    const popularItems = Array.from(itemSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        orders: item.quantity,
        revenue: item.revenue
      }))

    console.log('📊 Popular items calculated:', popularItems.length)

    const metrics = {
      // Today's specific metrics (always show today's data)
      todayOrders: todayOrdersCount,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayCustomers,

      // Time range metrics (based on selected time range)
      totalMenuItems: menuItems?.length || 0,
      weeklyOrders: totalOrders,
      weeklyRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyOrders: totalOrders,
      monthlyRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topSellingItems: popularItems
    }

    // Generate chart data for the last 12 months
    const chartData = {
      revenue: new Array(12).fill(0),
      orders: new Array(12).fill(0),
      customers: new Array(12).fill(0),
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }

    // If we have orders, populate the current month's data
    if (totalOrders > 0) {
      const currentMonth = now.getMonth()
      chartData.revenue[currentMonth] = totalRevenue
      chartData.orders[currentMonth] = totalOrders
      chartData.customers[currentMonth] = totalCustomers
    }

    console.log('✅ Final metrics:', metrics)
    console.log('📊 Chart data generated:', chartData)

    return NextResponse.json({
      success: true,
      metrics,
      chartData,
      cafeteriaId,
      timeRange,
      dateRange: { start: startDateStr, end: endDateStr }
    })

  } catch (error) {
    console.error('❌ Error in cafeteria metrics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cafeteria metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
