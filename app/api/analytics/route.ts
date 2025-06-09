import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    console.log('🔍 Analytics API called with date range:', { startDate, endDate })

    const supabaseAdmin = createSupabaseAdmin()

    // Build the orders query with date filtering
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        created_at,
        updated_at,
        total_amount,
        admin_revenue,
        status,
        rating,
        order_items(
          quantity,
          price,
          item_id
        )
      `)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })

    if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate)
    if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate + 'T23:59:59')

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      throw ordersError
    }

    console.log('📊 Orders fetched:', orders?.length || 0)

    // Fetch menu items and cafeterias for data enrichment
    const { data: menuItems } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, price, category, cafeteria_id')

    const { data: cafeterias } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name')

    console.log('📋 Menu items fetched:', menuItems?.length || 0)
    console.log('🏪 Cafeterias fetched:', cafeterias?.length || 0)

    // Create lookup maps
    const menuItemsMap = menuItems ? Object.fromEntries(
      menuItems.map(item => [item.id, item])
    ) : {}

    const cafeteriasMap = cafeterias ? Object.fromEntries(
      cafeterias.map(caf => [caf.id, caf])
    ) : {}

    // Process analytics data
    const analyticsData = {
      orders: [],
      revenue: [],
      userActivity: [],
      labels: [],
      popularItems: { data: [], labels: [] },
      peakHours: { data: [], labels: ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM", "10PM"] },
      customerSatisfaction: { data: [], labels: ["Satisfied", "Neutral", "Unsatisfied"] },
      averageOrderValue: { data: [], labels: [] },
      metrics: {
        orderFulfillmentTime: 0,
        orderCompletionRate: 0,
        newCustomersCount: 0,
        returningCustomersRate: 0
      },
      topSellingItems: { data: [], labels: [] },
      itemRatings: { data: [], labels: [] },
      categoryPerformance: { data: [], labels: [] },
      menuEfficiencyTime: 0
    }

    if (orders && orders.length > 0) {
      console.log('📈 Processing analytics data...')

      // Generate date-based data
      const dateMap = new Map<string, { orders: number, revenue: number, users: Set<string> }>()

      orders.forEach(order => {
        const date = order.created_at.split('T')[0]
        if (!dateMap.has(date)) {
          dateMap.set(date, { orders: 0, revenue: 0, users: new Set() })
        }
        const dayData = dateMap.get(date)!
        dayData.orders += 1
        dayData.revenue += parseFloat(order.admin_revenue) || 0
        dayData.users.add(order.user_id)
      })

      // Convert to arrays for charts
      const sortedDates = Array.from(dateMap.keys()).sort()
      analyticsData.orders = sortedDates.map(date => dateMap.get(date)!.orders)
      analyticsData.revenue = sortedDates.map(date => dateMap.get(date)!.revenue)
      analyticsData.userActivity = sortedDates.map(date => dateMap.get(date)!.users.size)
      analyticsData.labels = sortedDates.map(date => {
        const dateObj = new Date(date)
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })

      // Calculate popular menu items
      const itemCounts: Record<string, { count: number, cafeteriaName: string }> = {}
      orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (item.item_id && menuItemsMap[item.item_id]) {
            const menuItem = menuItemsMap[item.item_id]
            const cafeteria = cafeteriasMap[menuItem.cafeteria_id]
            const itemKey = `${menuItem.name} (${cafeteria?.name || 'Unknown'})`

            if (!itemCounts[itemKey]) {
              itemCounts[itemKey] = { count: 0, cafeteriaName: cafeteria?.name || 'Unknown' }
            }
            itemCounts[itemKey].count += item.quantity
          }
        })
      })

      const sortedItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5)

      analyticsData.popularItems = {
        labels: sortedItems.map(([name]) => name),
        data: sortedItems.map(([,data]) => data.count)
      }

      // Calculate peak hours
      const hourCounts = new Array(8).fill(0)
      orders.forEach(order => {
        const orderDate = new Date(order.created_at)
        const hour = orderDate.getHours()

        let slotIndex = -1
        if (hour >= 8 && hour < 10) slotIndex = 0
        else if (hour >= 10 && hour < 12) slotIndex = 1
        else if (hour >= 12 && hour < 14) slotIndex = 2
        else if (hour >= 14 && hour < 16) slotIndex = 3
        else if (hour >= 16 && hour < 18) slotIndex = 4
        else if (hour >= 18 && hour < 20) slotIndex = 5
        else if (hour >= 20 && hour < 22) slotIndex = 6
        else if (hour >= 22 || hour < 2) slotIndex = 7

        if (slotIndex >= 0 && slotIndex < 8) {
          hourCounts[slotIndex]++
        }
      })

      analyticsData.peakHours.data = hourCounts

      // Calculate customer satisfaction
      const ratings = orders.filter(order => order.rating).map(order => order.rating)
      if (ratings.length > 0) {
        const satisfied = ratings.filter(r => r >= 4).length
        const neutral = ratings.filter(r => r === 3).length
        const unsatisfied = ratings.filter(r => r <= 2).length
        const total = ratings.length

        analyticsData.customerSatisfaction.data = [
          Math.round((satisfied / total) * 100),
          Math.round((neutral / total) * 100),
          Math.round((unsatisfied / total) * 100)
        ]
      }

      // Calculate Order Fulfillment Time
      const completedOrders = orders.filter(order => order.status === 'completed' && order.updated_at)
      if (completedOrders.length > 0) {
        const fulfillmentTimes = completedOrders.map(order => {
          const created = new Date(order.created_at).getTime()
          const updated = new Date(order.updated_at).getTime()
          return (updated - created) / (1000 * 60) // Convert to minutes
        })
        analyticsData.metrics.orderFulfillmentTime = Math.round(
          fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length
        )
      }

      // Calculate Order Completion Rate (completed vs non-cancelled orders)
      const totalOrders = orders.length
      const completedOrdersCount = orders.filter(order => order.status === 'completed').length
      const cancelledOrdersCount = orders.filter(order => order.status === 'cancelled').length
      const validOrders = totalOrders - cancelledOrdersCount // Exclude cancelled orders from calculation

      analyticsData.metrics.orderCompletionRate = validOrders > 0
        ? Math.round((completedOrdersCount / validOrders) * 100 * 10) / 10
        : 0

      // Calculate Returning Customers and Repeat Order Rate
      const userOrderCounts = {}
      orders.forEach(order => {
        if (order.user_id) {
          userOrderCounts[order.user_id] = (userOrderCounts[order.user_id] || 0) + 1
        }
      })

      const totalUniqueCustomers = Object.keys(userOrderCounts).length
      const returningCustomers = Object.values(userOrderCounts).filter(count => count > 1).length
      const repeatOrders = Object.values(userOrderCounts).reduce((sum, count) => sum + Math.max(0, count - 1), 0)
      const totalOrdersFromReturning = Object.values(userOrderCounts).reduce((sum, count) => sum + (count > 1 ? count : 0), 0)

      analyticsData.metrics.newCustomersCount = totalUniqueCustomers - returningCustomers
      analyticsData.metrics.returningCustomersRate = totalUniqueCustomers > 0
        ? Math.round((returningCustomers / totalUniqueCustomers) * 100)
        : 0

      // Calculate Top Selling Items (by revenue)
      const itemRevenue = {}
      orders.forEach(order => {
        order.order_items?.forEach((item) => {
          if (item.item_id && menuItemsMap[item.item_id]) {
            const menuItem = menuItemsMap[item.item_id]
            const cafeteria = cafeteriasMap[menuItem.cafeteria_id]
            const itemKey = `${menuItem.name} (${cafeteria?.name || 'Unknown'})`
            const revenue = (item.price || menuItem.price || 0) * item.quantity
            itemRevenue[itemKey] = (itemRevenue[itemKey] || 0) + revenue
          }
        })
      })

      const sortedItemsByRevenue = Object.entries(itemRevenue)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)

      analyticsData.topSellingItems = {
        labels: sortedItemsByRevenue.map(([name]) => name),
        data: sortedItemsByRevenue.map(([,revenue]) => Math.round(revenue * 100) / 100) // Round to 2 decimals
      }

      // Calculate Item Ratings (average rating per item)
      const itemRatings = {}
      orders.forEach(order => {
        if (order.rating && order.order_items) {
          order.order_items.forEach((item) => {
            if (item.item_id && menuItemsMap[item.item_id]) {
              const menuItem = menuItemsMap[item.item_id]
              const cafeteria = cafeteriasMap[menuItem.cafeteria_id]
              const itemKey = `${menuItem.name} (${cafeteria?.name || 'Unknown'})`
              if (!itemRatings[itemKey]) {
                itemRatings[itemKey] = { total: 0, count: 0 }
              }
              itemRatings[itemKey].total += order.rating
              itemRatings[itemKey].count += 1
            }
          })
        }
      })

      const sortedItemsByRating = Object.entries(itemRatings)
        .map(([name, data]) => [name, data.total / data.count])
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)

      analyticsData.itemRatings = {
        labels: sortedItemsByRating.map(([name]) => name),
        data: sortedItemsByRating.map(([,rating]) => Math.round(rating * 10) / 10) // Round to 1 decimal
      }

      // Calculate Category Performance
      const categoryOrders = {}
      orders.forEach(order => {
        order.order_items?.forEach((item) => {
          if (item.item_id && menuItemsMap[item.item_id]) {
            const category = menuItemsMap[item.item_id].category
            if (category) {
              categoryOrders[category] = (categoryOrders[category] || 0) + item.quantity
            }
          }
        })
      })

      const sortedCategories = Object.entries(categoryOrders)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6) // Top 6 categories

      analyticsData.categoryPerformance = {
        labels: sortedCategories.map(([name]) => name),
        data: sortedCategories.map(([,count]) => count)
      }

      // Calculate Menu Efficiency (preparation time analysis)
      const preparedOrders = orders.filter(order =>
        (order.status === 'completed' || order.status === 'ready') &&
        order.updated_at &&
        order.created_at
      )

      if (preparedOrders.length > 0) {
        const preparationTimes = preparedOrders.map(order => {
          const created = new Date(order.created_at).getTime()
          const updated = new Date(order.updated_at).getTime()
          return (updated - created) / (1000 * 60) // Convert to minutes
        })
        analyticsData.menuEfficiencyTime = Math.round(
          (preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length) * 10
        ) / 10 // Round to 1 decimal
      }

      // Calculate Average Order Value by day (using the same date mapping as other charts)
      const avgOrderValueByDay = sortedDates.map(date => {
        const dayOrders = orders.filter(order => order.created_at.split('T')[0] === date)
        if (dayOrders.length === 0) return 0
        const totalValue = dayOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
        return Math.round((totalValue / dayOrders.length) * 100) / 100 // Round to 2 decimals
      })

      analyticsData.averageOrderValue = {
        data: avgOrderValueByDay,
        labels: analyticsData.labels
      }

      console.log('✅ Analytics data processed successfully')
    } else {
      console.log('📊 No orders found for the specified date range')
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    )
  }
}
