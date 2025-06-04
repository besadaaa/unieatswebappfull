import { supabase } from './supabase'

export interface DashboardMetrics {
  todayOrders: number
  todayRevenue: number
  todayCustomers: number
  totalMenuItems: number
  weeklyOrders: number
  weeklyRevenue: number
  monthlyOrders: number
  monthlyRevenue: number
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topSellingItems: Array<{
    name: string
    orders: number
    revenue: number
  }>
}

export interface ChartData {
  revenue: number[]
  orders: number[]
  customers: number[]
  months: string[]
  dailyRevenue: number[]
  dailyOrders: number[]
  days: string[]
}

export interface TimeRangeData {
  startDate: string
  endDate: string
  label: string
}

export class DashboardService {
  // Get time range dates based on selection
  static getTimeRange(range: string): TimeRangeData {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'Today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          label: 'Today'
        }
      
      case 'This Week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return {
          startDate: weekStart.toISOString(),
          endDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          label: 'This Week'
        }
      
      case 'This Month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        return {
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString(),
          label: 'This Month'
        }
      
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1)
        const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 1)
        return {
          startDate: quarterStart.toISOString(),
          endDate: quarterEnd.toISOString(),
          label: 'This Quarter'
        }
      
      case 'This Year':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        const yearEnd = new Date(today.getFullYear() + 1, 0, 1)
        return {
          startDate: yearStart.toISOString(),
          endDate: yearEnd.toISOString(),
          label: 'This Year'
        }
      
      default:
        return this.getTimeRange('This Month')
    }
  }

  // Get dashboard metrics for a specific cafeteria
  static async getDashboardMetrics(cafeteriaId: string, timeRange: string = 'This Month'): Promise<DashboardMetrics> {
    try {
      const { startDate, endDate } = this.getTimeRange(timeRange)
      const today = new Date().toISOString().split('T')[0]

      console.log('Fetching dashboard metrics for cafeteria:', cafeteriaId, 'Time range:', timeRange)
      console.log('Date range:', { startDate, endDate, today })

      // Get today's orders
      const { data: todayOrders, error: todayOrdersError } = await supabase
        .from('orders')
        .select('id, total_amount, admin_revenue, user_id, status')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59')

      if (todayOrdersError) {
        console.error('Error fetching today orders:', todayOrdersError)
        throw todayOrdersError
      }

      console.log('Today orders fetched:', todayOrders?.length || 0)

      // Get total menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .eq('cafeteria_id', cafeteriaId)

      if (menuError) {
        console.error('Error fetching menu items:', menuError)
        throw menuError
      }

      console.log('Menu items fetched:', menuItems?.length || 0)

      // Get orders in time range
      const { data: rangeOrders, error: rangeError } = await supabase
        .from('orders')
        .select('id, total_amount, admin_revenue, user_id, created_at, status')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', startDate)
        .lt('created_at', endDate)

      if (rangeError) {
        console.error('Error fetching range orders:', rangeError)
        throw rangeError
      }

      console.log('Range orders fetched:', rangeOrders?.length || 0)

      // Get top selling items
      const { data: topItems, error: topItemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_items(name, price),
          orders!inner(cafeteria_id, created_at)
        `)
        .eq('orders.cafeteria_id', cafeteriaId)
        .gte('orders.created_at', startDate)
        .lt('orders.created_at', endDate)

      if (topItemsError) throw topItemsError

      // Calculate metrics - Cafeteria revenue is total_amount minus admin_revenue (platform's cut)
      const todayRevenue = todayOrders?.reduce((sum, order) => {
        const totalAmount = parseFloat(order.total_amount) || 0
        const adminRevenue = parseFloat(order.admin_revenue) || 0
        const cafeteriaRevenue = totalAmount - adminRevenue
        return sum + cafeteriaRevenue
      }, 0) || 0

      const todayCustomers = new Set(todayOrders?.map(order => order.user_id)).size || 0

      const totalRevenue = rangeOrders?.reduce((sum, order) => {
        const totalAmount = parseFloat(order.total_amount) || 0
        const adminRevenue = parseFloat(order.admin_revenue) || 0
        const cafeteriaRevenue = totalAmount - adminRevenue
        return sum + cafeteriaRevenue
      }, 0) || 0

      const totalOrdersCount = rangeOrders?.length || 0
      const uniqueCustomers = new Set(rangeOrders?.map(order => order.user_id)).size || 0

      console.log('Calculated metrics:', {
        todayOrders: todayOrders?.length || 0,
        todayRevenue,
        todayCustomers,
        totalOrders: totalOrdersCount,
        totalRevenue,
        uniqueCustomers,
        menuItems: menuItems?.length || 0
      })

      // Process top selling items
      const itemSales = new Map<string, { orders: number; revenue: number }>()
      
      topItems?.forEach(item => {
        const menuItem = item.menu_items
        if (menuItem && menuItem.name) {
          const existing = itemSales.get(menuItem.name) || { orders: 0, revenue: 0 }
          existing.orders += item.quantity || 0
          existing.revenue += (item.quantity || 0) * (menuItem.price || 0)
          itemSales.set(menuItem.name, existing)
        }
      })

      const topSellingItems = Array.from(itemSales.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 8)

      return {
        todayOrders: todayOrders?.length || 0,
        todayRevenue,
        todayCustomers,
        totalMenuItems: menuItems?.length || 0,
        weeklyOrders: totalOrdersCount,
        weeklyRevenue: totalRevenue,
        monthlyOrders: totalOrdersCount,
        monthlyRevenue: totalRevenue,
        totalOrders: totalOrdersCount,
        totalRevenue,
        averageOrderValue: totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0,
        topSellingItems
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      return {
        todayOrders: 0,
        todayRevenue: 0,
        todayCustomers: 0,
        totalMenuItems: 0,
        weeklyOrders: 0,
        weeklyRevenue: 0,
        monthlyOrders: 0,
        monthlyRevenue: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topSellingItems: []
      }
    }
  }

  // Get chart data for dashboard
  static async getChartData(cafeteriaId: string, timeRange: string = 'This Month'): Promise<ChartData> {
    try {
      const { startDate, endDate } = this.getTimeRange(timeRange)

      console.log('Fetching chart data for cafeteria:', cafeteriaId, 'Time range:', timeRange)
      console.log('Chart date range:', { startDate, endDate })

      // Get orders data grouped by time period
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, admin_revenue, user_id')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at')

      if (error) {
        console.error('Error fetching chart orders:', error)
        throw error
      }

      console.log('Chart orders fetched:', orders?.length || 0)

      // Process data based on time range
      if (timeRange === 'Today' || timeRange === 'This Week') {
        // Daily data
        const dailyData = new Map<string, { revenue: number; orders: number; customers: Set<string> }>()
        
        orders?.forEach(order => {
          const date = order.created_at.split('T')[0]
          const existing = dailyData.get(date) || { revenue: 0, orders: 0, customers: new Set() }
          // Calculate cafeteria revenue (total_amount - admin_revenue)
          const totalAmount = parseFloat(order.total_amount) || 0
          const adminRevenue = parseFloat(order.admin_revenue) || 0
          const cafeteriaRevenue = totalAmount - adminRevenue
          existing.revenue += cafeteriaRevenue
          existing.orders += 1
          existing.customers.add(order.user_id)
          dailyData.set(date, existing)
        })

        const sortedDates = Array.from(dailyData.keys()).sort()
        const dailyRevenue = sortedDates.map(date => dailyData.get(date)?.revenue || 0)
        const dailyOrders = sortedDates.map(date => dailyData.get(date)?.orders || 0)
        const dailyCustomers = sortedDates.map(date => dailyData.get(date)?.customers.size || 0)
        const days = sortedDates.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' }))

        return {
          revenue: dailyRevenue,
          orders: dailyOrders,
          customers: dailyCustomers,
          months: days,
          dailyRevenue,
          dailyOrders,
          days
        }
      } else {
        // Monthly data
        const monthlyData = new Map<string, { revenue: number; orders: number; customers: Set<string> }>()
        
        orders?.forEach(order => {
          const date = new Date(order.created_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const existing = monthlyData.get(monthKey) || { revenue: 0, orders: 0, customers: new Set() }
          // Calculate cafeteria revenue (total_amount - admin_revenue)
          const totalAmount = parseFloat(order.total_amount) || 0
          const adminRevenue = parseFloat(order.admin_revenue) || 0
          const cafeteriaRevenue = totalAmount - adminRevenue
          existing.revenue += cafeteriaRevenue
          existing.orders += 1
          existing.customers.add(order.user_id)
          monthlyData.set(monthKey, existing)
        })

        const sortedMonths = Array.from(monthlyData.keys()).sort()
        const monthlyRevenue = sortedMonths.map(month => monthlyData.get(month)?.revenue || 0)
        const monthlyOrders = sortedMonths.map(month => monthlyData.get(month)?.orders || 0)
        const monthlyCustomers = sortedMonths.map(month => monthlyData.get(month)?.customers.size || 0)
        const months = sortedMonths.map(month => {
          const [year, monthNum] = month.split('-')
          return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short' })
        })

        return {
          revenue: monthlyRevenue,
          orders: monthlyOrders,
          customers: monthlyCustomers,
          months,
          dailyRevenue: monthlyRevenue,
          dailyOrders: monthlyOrders,
          days: months
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      return {
        revenue: [],
        orders: [],
        customers: [],
        months: [],
        dailyRevenue: [],
        dailyOrders: [],
        days: []
      }
    }
  }

  // Get current user's cafeteria ID
  static async getCurrentCafeteriaId(): Promise<string | null> {
    try {
      console.log('🔍 Getting current cafeteria ID...')

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('❌ Auth error:', authError)
        return null
      }

      if (!user) {
        console.log('❌ No authenticated user found')
        return null
      }

      console.log('✅ User authenticated:', user.id)

      const { data: cafeterias, error } = await supabase
        .from('cafeterias')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .single()

      if (error) {
        console.error('❌ Error fetching cafeteria:', error)

        // If no cafeteria found for this user, try to get any cafeteria for demo purposes
        console.log('🔍 No cafeteria found for user, trying to get any available cafeteria...')
        const { data: anyCafeteria, error: anyError } = await supabase
          .from('cafeterias')
          .select('id, name')
          .limit(1)
          .single()

        if (anyError) {
          console.error('❌ No cafeterias found at all:', anyError)
          return null
        }

        console.log('✅ Using demo cafeteria:', anyCafeteria)
        return anyCafeteria?.id || null
      }

      console.log('✅ Found cafeteria for user:', cafeterias)
      return cafeterias?.id || null
    } catch (error) {
      console.error('❌ Error getting cafeteria ID:', error)
      return null
    }
  }
}
