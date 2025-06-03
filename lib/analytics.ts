// Real-time Analytics System with Supabase Integration
import { supabase } from './supabase'
import { logUserActivity } from './financial'

export interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  averageOrderValue: number
  orderCompletionRate: number
  customerSatisfaction: number
  peakHours: { hour: number; orders: number }[]
  popularItems: { name: string; count: number; revenue: number }[]
  dailyTrends: { date: string; orders: number; revenue: number }[]
  categoryPerformance: { category: string; orders: number; revenue: number }[]
}

export interface CafeteriaAnalytics extends AnalyticsData {
  cafeteriaId: string
  cafeteriaName: string
  inventoryAlerts: { item: string; currentStock: number; minStock: number }[]
  customerRetention: number
  averagePreparationTime: number
}

export interface AdminAnalytics {
  systemOverview: {
    totalCafeterias: number
    activeCafeterias: number
    totalUsers: number
    totalOrders: number
    platformRevenue: number
    totalCommissions: number
  }
  cafeteriaPerformance: {
    id: string
    name: string
    orders: number
    revenue: number
    rating: number
    status: string
  }[]
  userGrowth: { date: string; newUsers: number; totalUsers: number }[]
  revenueBreakdown: {
    serviceFees: number
    commissions: number
    totalPlatformRevenue: number
  }
  systemHealth: {
    orderProcessingTime: number
    systemUptime: number
    errorRate: number
    activeUsers: number
  }
}

// Get real-time analytics for cafeteria dashboard
export const getCafeteriaAnalytics = async (
  cafeteriaId: string,
  timeRange: number = 30
): Promise<CafeteriaAnalytics | null> => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)
    
    // Get cafeteria info
    const { data: cafeteria } = await supabase
      .from('cafeterias')
      .select('name')
      .eq('id', cafeteriaId)
      .single()
    
    // Get orders with related data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_items(name, category, price)
        ),
        transactions(*),
        profiles(full_name)
      `)
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', startDate.toISOString())
    
    if (ordersError) throw ordersError
    
    // Get menu items for popular items analysis
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
    
    // Get inventory for alerts
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
    
    // Calculate analytics
    const totalOrders = orders?.length || 0
    const completedOrders = orders?.filter(o => o.status === 'completed') || []
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const transaction = order.transactions?.[0]
      return sum + (transaction?.net_to_cafeteria || 0)
    }, 0)
    
    const uniqueCustomers = new Set(orders?.map(o => o.user_id)).size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const orderCompletionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
    
    // Customer satisfaction from ratings
    const ratingsData = completedOrders.filter(o => o.rating)
    const customerSatisfaction = ratingsData.length > 0 
      ? ratingsData.reduce((sum, o) => sum + o.rating, 0) / ratingsData.length 
      : 0
    
    // Peak hours analysis
    const hourlyOrders = orders?.reduce((acc, order) => {
      const hour = new Date(order.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>) || {}
    
    const peakHours = Object.entries(hourlyOrders)
      .map(([hour, count]) => ({ hour: parseInt(hour), orders: count }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6)
    
    // Popular items analysis
    const itemCounts = orders?.flatMap(order => 
      order.order_items?.map(item => ({
        menuItemId: item.menu_item_id,
        name: item.menu_items?.name || 'Unknown',
        quantity: item.quantity,
        revenue: item.price * item.quantity
      })) || []
    ) || []
    
    const popularItems = itemCounts.reduce((acc, item) => {
      if (!acc[item.menuItemId]) {
        acc[item.menuItemId] = {
          name: item.name,
          count: 0,
          revenue: 0
        }
      }
      acc[item.menuItemId].count += item.quantity
      acc[item.menuItemId].revenue += item.revenue
      return acc
    }, {} as Record<string, any>)
    
    const popularItemsArray = Object.values(popularItems)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)
    
    // Daily trends
    const dailyData = orders?.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, orders: 0, revenue: 0 }
      }
      acc[date].orders += 1
      const transaction = order.transactions?.[0]
      acc[date].revenue += transaction?.net_to_cafeteria || 0
      return acc
    }, {} as Record<string, any>) || {}
    
    const dailyTrends = Object.values(dailyData)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
    
    // Category performance
    const categoryData = orders?.flatMap(order => 
      order.order_items?.map(item => ({
        category: item.menu_items?.category || 'Other',
        revenue: item.price * item.quantity
      })) || []
    ) || []
    
    const categoryPerformance = categoryData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { category: item.category, orders: 0, revenue: 0 }
      }
      acc[item.category].orders += 1
      acc[item.category].revenue += item.revenue
      return acc
    }, {} as Record<string, any>)
    
    // Inventory alerts
    const inventoryAlerts = inventory?.filter(item => 
      item.quantity <= item.min_quantity
    ).map(item => ({
      item: item.name,
      currentStock: item.quantity,
      minStock: item.min_quantity
    })) || []
    
    // Customer retention (customers who ordered more than once)
    const customerOrderCounts = orders?.reduce((acc, order) => {
      acc[order.user_id] = (acc[order.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length
    const customerRetention = uniqueCustomers > 0 ? (returningCustomers / uniqueCustomers) * 100 : 0
    
    // Average preparation time
    const prepTimes = completedOrders
      .filter(o => o.preparation_started_at && o.ready_at)
      .map(o => {
        const start = new Date(o.preparation_started_at!).getTime()
        const ready = new Date(o.ready_at!).getTime()
        return (ready - start) / (1000 * 60) // minutes
      })
    
    const averagePreparationTime = prepTimes.length > 0 
      ? prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length 
      : 0
    
    const analytics: CafeteriaAnalytics = {
      cafeteriaId,
      cafeteriaName: cafeteria?.name || 'Unknown',
      totalOrders,
      totalRevenue,
      totalCustomers: uniqueCustomers,
      averageOrderValue,
      orderCompletionRate,
      customerSatisfaction,
      peakHours,
      popularItems: popularItemsArray,
      dailyTrends,
      categoryPerformance: Object.values(categoryPerformance),
      inventoryAlerts,
      customerRetention,
      averagePreparationTime
    }
    
    // Log analytics access
    await logUserActivity(
      null, // Will be set by the calling function
      'analytics_accessed',
      'cafeteria_analytics',
      cafeteriaId,
      { timeRange, totalOrders, totalRevenue }
    )
    
    return analytics
  } catch (error) {
    console.error('Error getting cafeteria analytics:', error)
    return null
  }
}

// Get admin analytics with system overview
export const getAdminAnalytics = async (timeRange: number = 30): Promise<AdminAnalytics | null> => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)
    
    // Get system overview data
    const [
      { data: cafeterias },
      { data: users },
      { data: orders },
      { data: transactions }
    ] = await Promise.all([
      supabase.from('cafeterias').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('orders').select('*').gte('created_at', startDate.toISOString()),
      supabase.from('transactions').select('*').gte('created_at', startDate.toISOString())
    ])
    
    const systemOverview = {
      totalCafeterias: cafeterias?.length || 0,
      activeCafeterias: cafeterias?.filter(c => c.approval_status === 'approved').length || 0,
      totalUsers: users?.length || 0,
      totalOrders: orders?.length || 0,
      platformRevenue: transactions?.reduce((sum, t) => sum + t.platform_revenue, 0) || 0,
      totalCommissions: transactions?.reduce((sum, t) => sum + t.commission, 0) || 0
    }
    
    // Cafeteria performance
    const cafeteriaPerformance = await Promise.all(
      (cafeterias || []).map(async (cafeteria) => {
        const { data: cafeteriaOrders } = await supabase
          .from('orders')
          .select('*, transactions(*)')
          .eq('cafeteria_id', cafeteria.id)
          .gte('created_at', startDate.toISOString())
        
        const revenue = cafeteriaOrders?.reduce((sum, order) => {
          const transaction = order.transactions?.[0]
          return sum + (transaction?.order_amount || 0)
        }, 0) || 0
        
        return {
          id: cafeteria.id,
          name: cafeteria.name,
          orders: cafeteriaOrders?.length || 0,
          revenue,
          rating: cafeteria.rating || 0,
          status: cafeteria.approval_status || 'pending'
        }
      })
    )
    
    // User growth analysis
    const userGrowthData = users?.reduce((acc, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, newUsers: 0, totalUsers: 0 }
      }
      acc[date].newUsers += 1
      return acc
    }, {} as Record<string, any>) || {}
    
    // Calculate cumulative total users
    let cumulativeUsers = 0
    const userGrowth = Object.values(userGrowthData)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((day: any) => {
        cumulativeUsers += day.newUsers
        return { ...day, totalUsers: cumulativeUsers }
      })
    
    // Revenue breakdown
    const revenueBreakdown = {
      serviceFees: transactions?.reduce((sum, t) => sum + t.service_fee, 0) || 0,
      commissions: transactions?.reduce((sum, t) => sum + t.commission, 0) || 0,
      totalPlatformRevenue: transactions?.reduce((sum, t) => sum + t.platform_revenue, 0) || 0
    }
    
    // System health metrics (mock for now, would be real monitoring in production)
    const systemHealth = {
      orderProcessingTime: 2.5, // average minutes
      systemUptime: 99.9, // percentage
      errorRate: 0.1, // percentage
      activeUsers: users?.filter(u => {
        const lastLogin = new Date(u.last_login_at || u.created_at)
        const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceLogin <= 7
      }).length || 0
    }
    
    const analytics: AdminAnalytics = {
      systemOverview,
      cafeteriaPerformance,
      userGrowth,
      revenueBreakdown,
      systemHealth
    }
    
    return analytics
  } catch (error) {
    console.error('Error getting admin analytics:', error)
    return null
  }
}

// Update cafeteria performance metrics (daily job)
export const updateCafeteriaPerformanceMetrics = async (cafeteriaId: string, date: string) => {
  try {
    const analytics = await getCafeteriaAnalytics(cafeteriaId, 1) // Get today's data
    
    if (!analytics) return false
    
    const metricsData = {
      cafeteria_id: cafeteriaId,
      date,
      total_orders: analytics.totalOrders,
      total_revenue: analytics.totalRevenue,
      average_order_value: analytics.averageOrderValue,
      customer_satisfaction: analytics.customerSatisfaction,
      order_completion_rate: analytics.orderCompletionRate,
      average_prep_time: analytics.averagePreparationTime,
      peak_hour_start: analytics.peakHours[0]?.hour ? `${analytics.peakHours[0].hour}:00` : null,
      peak_hour_end: analytics.peakHours[0]?.hour ? `${analytics.peakHours[0].hour + 1}:00` : null
    }
    
    const { error } = await supabase
      .from('cafeteria_performance_metrics')
      .upsert([metricsData])
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Error updating performance metrics:', error)
    return false
  }
}
