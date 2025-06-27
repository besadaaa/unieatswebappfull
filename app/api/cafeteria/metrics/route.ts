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

    if (!supabaseAdmin) {
      console.error('❌ Cafeteria Metrics API: Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    console.log('🏪 Fetching cafeteria metrics for:', cafeteriaId, 'Time range:', timeRange)

    // Calculate date range based on timeRange
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (timeRange) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'This Week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Today's date for today-specific metrics
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    console.log('📅 Date ranges:', {
      timeRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      today: `${todayStart.toISOString()} to ${todayEnd.toISOString()}`
    })

    // Fetch orders for the time range
    const { data: allOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, price)
        )
      `)
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Fetch today's orders separately
    const { data: todayOrdersList, error: todayOrdersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .neq('status', 'cancelled')

    if (todayOrdersError) {
      console.error('Error fetching today orders:', todayOrdersError)
    }

    // Fetch menu items count
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id')
      .eq('cafeteria_id', cafeteriaId)

    if (menuError) {
      console.error('Error fetching menu items:', menuError)
    }

    console.log('📊 Data fetched:', {
      totalOrders: allOrders?.length || 0,
      todayOrders: todayOrdersList?.length || 0,
      menuItems: menuItems?.length || 0
    })

    // Calculate metrics
    const totalOrders = allOrders?.length || 0
    const totalRevenue = allOrders?.reduce((sum, order) => {
      // Cafeteria gets 90% of the total amount (10% goes to admin as commission)
      const cafeteriaRevenue = (parseFloat(order.total_amount) || 0) * 0.9
      return sum + cafeteriaRevenue
    }, 0) || 0

    const totalCustomers = new Set(allOrders?.map(order => order.user_id) || []).size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Today's metrics
    const todayOrdersCount = todayOrdersList?.length || 0
    const todayRevenue = todayOrdersList?.reduce((sum, order) => {
      const cafeteriaRevenue = (parseFloat(order.total_amount) || 0) * 0.9
      return sum + cafeteriaRevenue
    }, 0) || 0
    const todayCustomers = new Set(todayOrdersList?.map(order => order.user_id) || []).size

    // Calculate top selling items
    const itemSales = new Map()
    
    allOrders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const itemName = item.menu_items?.name || 'Unknown Item'
        const key = itemName
        
        if (itemSales.has(key)) {
          const existing = itemSales.get(key)
          existing.quantity += item.quantity || 0
          existing.revenue += (parseFloat(item.menu_items?.price) || 0) * (item.quantity || 0) * 0.9
          itemSales.set(key, existing)
        } else {
          itemSales.set(key, {
            name: itemName,
            quantity: item.quantity || 0,
            revenue: (parseFloat(item.menu_items?.price) || 0) * (item.quantity || 0) * 0.9
          })
        }
      })
    })

    const topSellingItems = Array.from(itemSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        orders: item.quantity,
        revenue: Math.round(item.revenue * 100) / 100
      }))

    // Generate chart data for the last 12 months
    const chartMonths = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return date
    })

    const chartData = {
      revenue: chartMonths.map(month => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
        
        const monthOrders = allOrders?.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate >= monthStart && orderDate <= monthEnd
        }) || []
        
        return monthOrders.reduce((sum, order) => {
          return sum + (parseFloat(order.total_amount) || 0) * 0.9
        }, 0)
      }),
      orders: chartMonths.map(month => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
        
        return allOrders?.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate >= monthStart && orderDate <= monthEnd
        }).length || 0
      }),
      customers: chartMonths.map(month => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
        
        const monthOrders = allOrders?.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate >= monthStart && orderDate <= monthEnd
        }) || []
        
        return new Set(monthOrders.map(order => order.user_id)).size
      }),
      months: chartMonths.map(month => month.toLocaleDateString('en-US', { month: 'short' }))
    }

    const metrics = {
      // Today's specific metrics
      todayOrders: todayOrdersCount,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayCustomers,

      // Time range metrics
      totalMenuItems: menuItems?.length || 0,
      weeklyOrders: totalOrders,
      weeklyRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyOrders: totalOrders,
      monthlyRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topSellingItems
    }

    console.log('✅ Cafeteria metrics calculated:', {
      todayOrders: metrics.todayOrders,
      todayRevenue: metrics.todayRevenue,
      totalOrders: metrics.totalOrders,
      totalRevenue: metrics.totalRevenue,
      topItems: metrics.topSellingItems.length
    })

    return NextResponse.json({
      success: true,
      metrics,
      chartData,
      timeRange,
      cafeteriaId
    })

  } catch (error) {
    console.error('Error in cafeteria metrics API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
