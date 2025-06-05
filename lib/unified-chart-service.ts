import { supabase } from './supabase'

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }[]
}

export class UnifiedChartService {
  // Get real popular items data for any cafeteria
  static async getPopularItems(cafeteriaId: string, limit: number = 8): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching popular items for cafeteria:', cafeteriaId)

      // Get orders with order items and menu items
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_items!inner(id, name, cafeteria_id),
          orders!inner(cafeteria_id, status, created_at)
        `)
        .eq('orders.cafeteria_id', cafeteriaId)
        .in('orders.status', ['completed', 'ready', 'preparing']) // Only count meaningful orders
        .gte('orders.created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (error) {
        console.error('Error fetching popular items:', error)
        return []
      }

      // Aggregate by menu item
      const itemCounts = new Map<string, { name: string; count: number }>()
      
      orderItems?.forEach(item => {
        const menuItem = item.menu_items
        if (menuItem && menuItem.name) {
          const existing = itemCounts.get(menuItem.id) || { name: menuItem.name, count: 0 }
          existing.count += item.quantity || 0
          itemCounts.set(menuItem.id, existing)
        }
      })

      // Convert to array and sort
      const popularItems = Array.from(itemCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item, index) => ({
          label: item.name,
          value: item.count,
          color: this.getColorForIndex(index)
        }))

      console.log('Popular items result:', popularItems)
      return popularItems

    } catch (error) {
      console.error('Error in getPopularItems:', error)
      return []
    }
  }

  // Get real revenue data over time
  static async getRevenueOverTime(
    cafeteriaId: string, 
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TimeSeriesData> {
    try {
      console.log('Fetching revenue over time for cafeteria:', cafeteriaId, 'Range:', timeRange)

      const { startDate, endDate, groupBy } = this.getTimeRangeConfig(timeRange)

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at')

      if (error) {
        console.error('Error fetching revenue data:', error)
        return { labels: [], datasets: [] }
      }

      // Group data by time period
      const groupedData = this.groupDataByTime(orders || [], groupBy)
      
      return {
        labels: groupedData.labels,
        datasets: [{
          label: 'Revenue',
          data: groupedData.values,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: '#10b981'
        }]
      }

    } catch (error) {
      console.error('Error in getRevenueOverTime:', error)
      return { labels: [], datasets: [] }
    }
  }

  // Get real orders count over time
  static async getOrdersOverTime(
    cafeteriaId: string, 
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TimeSeriesData> {
    try {
      console.log('Fetching orders over time for cafeteria:', cafeteriaId, 'Range:', timeRange)

      const { startDate, endDate, groupBy } = this.getTimeRangeConfig(timeRange)

      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at')

      if (error) {
        console.error('Error fetching orders data:', error)
        return { labels: [], datasets: [] }
      }

      // Group data by time period (count orders)
      const groupedData = this.groupDataByTime(orders || [], groupBy, 'count')
      
      return {
        labels: groupedData.labels,
        datasets: [{
          label: 'Orders',
          data: groupedData.values,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: '#8b5cf6'
        }]
      }

    } catch (error) {
      console.error('Error in getOrdersOverTime:', error)
      return { labels: [], datasets: [] }
    }
  }

  // Get real category performance data
  static async getCategoryPerformance(cafeteriaId: string): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching category performance for cafeteria:', cafeteriaId)

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_items!inner(category, cafeteria_id),
          orders!inner(cafeteria_id, status)
        `)
        .eq('orders.cafeteria_id', cafeteriaId)
        .in('orders.status', ['completed', 'ready', 'preparing'])

      if (error) {
        console.error('Error fetching category performance:', error)
        return []
      }

      // Aggregate by category
      const categoryData = new Map<string, number>()
      
      orderItems?.forEach(item => {
        const category = item.menu_items?.category || 'Other'
        const existing = categoryData.get(category) || 0
        categoryData.set(category, existing + (item.quantity || 0))
      })

      // Convert to array
      return Array.from(categoryData.entries())
        .map(([category, count], index) => ({
          label: category,
          value: count,
          color: this.getColorForIndex(index)
        }))
        .sort((a, b) => b.value - a.value)

    } catch (error) {
      console.error('Error in getCategoryPerformance:', error)
      return []
    }
  }

  // Get real peak hours data
  static async getPeakHours(cafeteriaId: string): Promise<ChartDataPoint[]> {
    try {
      console.log('Fetching peak hours for cafeteria:', cafeteriaId)

      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      if (error) {
        console.error('Error fetching peak hours:', error)
        return []
      }

      // Group by hour
      const hourCounts = new Array(24).fill(0)
      
      orders?.forEach(order => {
        const hour = new Date(order.created_at).getHours()
        hourCounts[hour]++
      })

      // Convert to chart data (only show business hours 6 AM - 10 PM)
      return hourCounts
        .slice(6, 22)
        .map((count, index) => ({
          label: `${6 + index}:00`,
          value: count,
          color: this.getColorForIndex(index)
        }))

    } catch (error) {
      console.error('Error in getPeakHours:', error)
      return []
    }
  }

  // Helper: Get time range configuration
  private static getTimeRangeConfig(timeRange: string) {
    const now = new Date()
    let startDate: Date
    let endDate = now
    let groupBy: 'day' | 'week' | 'month'

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        groupBy = 'week'
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        groupBy = 'month'
        break
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
    }

    return { startDate, endDate, groupBy }
  }

  // Helper: Group data by time period
  private static groupDataByTime(
    data: any[], 
    groupBy: 'day' | 'week' | 'month',
    aggregation: 'sum' | 'count' = 'sum'
  ) {
    const groups = new Map<string, number>()

    data.forEach(item => {
      const date = new Date(item.created_at)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }

      const existing = groups.get(key) || 0
      const value = aggregation === 'count' ? 1 : (parseFloat(item.total_amount) || 0)
      groups.set(key, existing + value)
    })

    // Sort by date and format labels
    const sortedEntries = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
    
    return {
      labels: sortedEntries.map(([key]) => this.formatDateLabel(key, groupBy)),
      values: sortedEntries.map(([, value]) => value)
    }
  }

  // Helper: Format date labels
  private static formatDateLabel(key: string, groupBy: 'day' | 'week' | 'month'): string {
    const date = new Date(key)
    
    switch (groupBy) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      default:
        return key
    }
  }

  // Helper: Get consistent colors for chart items
  private static getColorForIndex(index: number): string {
    const colors = [
      'rgba(245, 158, 11, 0.9)',   // Amber
      'rgba(16, 185, 129, 0.9)',   // Emerald
      'rgba(129, 140, 248, 0.9)',  // Indigo
      'rgba(249, 115, 22, 0.9)',   // Orange
      'rgba(6, 182, 212, 0.9)',    // Cyan
      'rgba(168, 85, 247, 0.9)',   // Purple
      'rgba(236, 72, 153, 0.9)',   // Pink
      'rgba(34, 197, 94, 0.9)',    // Green
      'rgba(239, 68, 68, 0.9)',    // Red
      'rgba(59, 130, 246, 0.9)'    // Blue
    ]
    return colors[index % colors.length]
  }

  // Helper: Get current user's cafeteria ID
  static async getCurrentCafeteriaId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: cafeterias, error } = await supabase
        .from('cafeterias')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (error) throw error

      return cafeterias?.id || null
    } catch (error) {
      console.error('Error getting cafeteria ID:', error)
      return null
    }
  }
}
