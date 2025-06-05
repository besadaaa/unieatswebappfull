"use client"

import { useState, useEffect } from "react"
import "@/styles/charts.css"
import { Charts } from "@/components/charts"
import { TrendChart } from "@/components/trend-chart"
import { TrendChartSkeleton } from "@/components/trend-chart-skeleton"
import { ChartSkeleton } from "@/components/ui/chart-skeleton"
import { ComparisonChartSkeleton } from "@/components/comparison-chart-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ComparisonToggle } from "@/components/ui/comparison-toggle"
import { ComparisonSummary } from "@/components/comparison-summary"
import { ComparisonChart } from "@/components/comparison-chart"
import {
  generateDataForDateRange,
  generateLabelsForDateRange,
  getDateRangeDescription,
  getPredefinedDateRanges,
  calculatePreviousPeriod,
  calculateTotal,
  generateComparisonSummary,
} from "@/lib/analytics-data"
import { Download, RefreshCw, FileText, FileSpreadsheet, FileIcon as FilePdf, TrendingUp } from "lucide-react"
import { exportChartsAsPDF, exportChartDataAsExcel } from "@/lib/chart-export-utils"
import { supabase } from "@/lib/supabase"
import { CHART_COLORS, PIE_CHART_COLORS, BAR_CHART_COLORS, useChartColors } from "@/lib/chart-colors"
import { format } from "date-fns"
import { CafeteriaPageHeader } from "@/components/cafeteria/page-header"
import { useUser } from "@/hooks/use-user"
import { UnifiedChartService } from "@/lib/unified-chart-service"

export default function CafeteriaAnalyticsPage() {
  // Get theme-aware colors
  const { colors, PIE_CHART_COLORS, BAR_CHART_COLORS, generateBackgroundColors } = useChartColors()
  const { user } = useUser()

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonDateRange, setComparisonDateRange] = useState<DateRange | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  const [isExporting, setIsExporting] = useState(false)
  const [showTrends, setShowTrends] = useState(false)

  // Data state
  const [orderData, setOrderData] = useState<number[]>([])
  const [revenueData, setRevenueData] = useState<number[]>([])
  const [userActivityData, setUserActivityData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])

  // Comparison data state
  const [comparisonOrderData, setComparisonOrderData] = useState<number[]>([])
  const [comparisonRevenueData, setComparisonRevenueData] = useState<number[]>([])
  const [comparisonUserActivityData, setComparisonUserActivityData] = useState<number[]>([])
  const [comparisonLabels, setComparisonLabels] = useState<string[]>([])

  // Analytics data state
  const [popularItemsData, setPopularItemsData] = useState<number[]>([])
  const [popularItemsLabels, setPopularItemsLabels] = useState<string[]>([])
  const [peakHoursData, setPeakHoursData] = useState<number[]>([])
  const [peakHoursLabels] = useState<string[]>(["8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM", "10PM"])
  const [customerSatisfactionData, setCustomerSatisfactionData] = useState<number[]>([])
  const [customerSatisfactionLabels] = useState<string[]>(["Satisfied", "Neutral", "Unsatisfied"])

  // Additional analytics data state
  const [averageOrderValueData, setAverageOrderValueData] = useState<number[]>([])
  const [averageOrderValueLabels, setAverageOrderValueLabels] = useState<string[]>([])
  const [orderFulfillmentTime, setOrderFulfillmentTime] = useState<number>(0)
  const [orderCompletionRate, setOrderCompletionRate] = useState<number>(0)
  const [newCustomersCount, setNewCustomersCount] = useState<number>(0)
  const [returningCustomersRate, setReturningCustomersRate] = useState<number>(0)
  const [topSellingItemsData, setTopSellingItemsData] = useState<number[]>([])
  const [topSellingItemsLabels, setTopSellingItemsLabels] = useState<string[]>([])
  const [itemRatingsData, setItemRatingsData] = useState<number[]>([])
  const [itemRatingsLabels, setItemRatingsLabels] = useState<string[]>([])
  const [categoryPerformanceData, setCategoryPerformanceData] = useState<number[]>([])
  const [categoryPerformanceLabels, setCategoryPerformanceLabels] = useState<string[]>([])
  const [menuEfficiencyTime, setMenuEfficiencyTime] = useState<number>(0)

  // Predefined date ranges
  const predefinedRanges = getPredefinedDateRanges()

  // Professional color schemes for different chart types
  const getChartColors = (type: 'line' | 'bar' | 'pie', dataLength: number = 1) => {
    switch (type) {
      case 'line':
        return {
          backgroundColor: generateBackgroundColors([colors.primary]),
          borderColor: [colors.primary],
          borderWidth: 3,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4
        }
      case 'bar':
        const barColors = dataLength <= 5 ? BAR_CHART_COLORS.slice(0, dataLength) : [colors.primary]
        return {
          backgroundColor: generateBackgroundColors(barColors),
          borderColor: barColors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      case 'pie':
        return {
          backgroundColor: PIE_CHART_COLORS.slice(0, dataLength),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverOffset: 10
        }
      default:
        return {
          backgroundColor: generateBackgroundColors([colors.primary]),
          borderColor: [colors.primary]
        }
    }
  }

  // Fetch analytics data from Supabase for the current cafeteria
  const fetchAnalyticsData = async (selectedDateRange?: DateRange) => {
    try {
      const dateFilter = selectedDateRange || dateRange
      const startDate = dateFilter?.from ? dateFilter.from.toISOString().split('T')[0] : null
      const endDate = dateFilter?.to ? dateFilter.to.toISOString().split('T')[0] : null

      // Get cafeteria ID for the current logged-in user
      let cafeteriaId = null
      if (user?.id) {
        try {
          console.log('🔍 Getting cafeteria for user:', user.email)

          // Get cafeteria owned by this user
          const { data: cafeteria, error: cafeteriaError } = await supabase
            .from('cafeterias')
            .select('id, name, owner_id')
            .eq('owner_id', user.id)
            .single()

          if (cafeteriaError || !cafeteria) {
            console.log('❌ No cafeteria found for user, showing all data')
          } else {
            cafeteriaId = cafeteria.id
            console.log('✅ Found cafeteria for analytics:', cafeteria.name, cafeteria.id)
          }
        } catch (error) {
          console.log('Error getting cafeteria, showing all data:', error)
        }
      }

      // Fetch orders data - filter by cafeteria if available, otherwise show all
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          user_id,
          created_at,
          updated_at,
          total_amount,
          status,
          rating,
          order_items(
            quantity,
            price,
            item_id
          )
        `)
        .order('created_at', { ascending: true })

      // Only filter by cafeteria if we have a cafeteria_id
      if (cafeteriaId) {
        // Use a different approach - filter orders by cafeteria_id directly
        ordersQuery = ordersQuery.eq('cafeteria_id', cafeteriaId)
      }

      if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate)
      if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate + 'T23:59:59')

      const { data: orders, error: ordersError } = await ordersQuery

      if (ordersError) throw ordersError

      // Fetch menu items separately to avoid relationship issues
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id, name, price, category, cafeteria_id')

      // Create a map for quick lookup
      const menuItemsMap = menuItems ? Object.fromEntries(
        menuItems.map(item => [item.id, item])
      ) : {}

      // Process orders data for charts
      if (orders) {
        // Generate date-based data
        const dateMap = new Map<string, { orders: number, revenue: number, users: Set<string> }>()

        orders.forEach(order => {
          const date = order.created_at.split('T')[0]
          if (!dateMap.has(date)) {
            dateMap.set(date, { orders: 0, revenue: 0, users: new Set() })
          }
          const dayData = dateMap.get(date)!
          dayData.orders += 1
          dayData.revenue += order.total_amount || 0
          dayData.users.add(order.user_id || order.id)
        })

        // Convert to arrays for charts
        const sortedDates = Array.from(dateMap.keys()).sort()
        const newOrderData = sortedDates.map(date => dateMap.get(date)!.orders)
        const newRevenueData = sortedDates.map(date => dateMap.get(date)!.revenue)
        const newUserActivityData = sortedDates.map(date => dateMap.get(date)!.users.size)
        const newLabels = sortedDates.map(date => format(new Date(date), "MMM dd"))

        setOrderData(newOrderData)
        setRevenueData(newRevenueData)
        setUserActivityData(newUserActivityData)
        setLabels(newLabels)

        // Calculate popular menu items
        console.log('Analytics Debug - Processing orders:', orders.length)
        console.log('Analytics Debug - Menu items map:', Object.keys(menuItemsMap).length)

        const itemCounts: Record<string, number> = {}
        orders.forEach(order => {
          console.log('Analytics Debug - Order:', order.id, 'Items:', order.order_items?.length)
          order.order_items?.forEach((item: any) => {
            console.log('Analytics Debug - Item:', item.item_id, 'Quantity:', item.quantity)
            if (item.item_id && menuItemsMap[item.item_id]) {
              const itemName = menuItemsMap[item.item_id].name
              itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity
              console.log('Analytics Debug - Added to counts:', itemName, itemCounts[itemName])
            } else {
              console.log('Analytics Debug - Item not found in menu map:', item.item_id)
            }
          })
        })

        console.log('Analytics Debug - Final item counts:', itemCounts)

        const sortedItems = Object.entries(itemCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)

        console.log('Analytics Debug - Sorted items:', sortedItems)

        setPopularItemsLabels(sortedItems.map(([name]) => name))
        setPopularItemsData(sortedItems.map(([,count]) => count))

        // Calculate peak hours
        const hourCounts = new Array(8).fill(0)
        orders.forEach(order => {
          const hour = new Date(order.created_at).getHours()
          const slotIndex = Math.floor((hour - 8) / 2)
          if (slotIndex >= 0 && slotIndex < 8) {
            hourCounts[slotIndex]++
          }
        })
        setPeakHoursData(hourCounts)

        // Calculate customer satisfaction from ratings
        const ratings = orders.filter(order => order.rating).map(order => order.rating)
        if (ratings.length > 0) {
          const satisfied = ratings.filter(r => r >= 4).length
          const neutral = ratings.filter(r => r === 3).length
          const unsatisfied = ratings.filter(r => r <= 2).length
          const total = ratings.length

          setCustomerSatisfactionData([
            Math.round((satisfied / total) * 100),
            Math.round((neutral / total) * 100),
            Math.round((unsatisfied / total) * 100)
          ])
        } else {
          setCustomerSatisfactionData([0, 0, 0])
        }

        // Calculate Average Order Value by day
        const avgOrderValueByDay = sortedDates.map(date => {
          const dayOrders = orders.filter(order => order.created_at.split('T')[0] === date)
          if (dayOrders.length === 0) return 0
          const totalValue = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
          return Math.round(totalValue / dayOrders.length)
        })
        setAverageOrderValueData(avgOrderValueByDay)
        setAverageOrderValueLabels(sortedDates.map(date => format(new Date(date), "MMM dd")))

        // Calculate Order Fulfillment Time
        const completedOrders = orders.filter(order => order.status === 'completed' && order.updated_at)
        if (completedOrders.length > 0) {
          const fulfillmentTimes = completedOrders.map(order => {
            const created = new Date(order.created_at).getTime()
            const updated = new Date(order.updated_at).getTime()
            return (updated - created) / (1000 * 60) // Convert to minutes
          })
          const avgFulfillmentTime = fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length
          setOrderFulfillmentTime(Math.round(avgFulfillmentTime))
        } else {
          setOrderFulfillmentTime(0)
        }

        // Calculate Order Completion Rate
        const totalOrders = orders.length
        const completedOrdersCount = orders.filter(order => order.status === 'completed').length
        const completionRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0
        setOrderCompletionRate(Math.round(completionRate * 10) / 10)

        // Calculate New vs Returning Customers
        const userOrderCounts: Record<string, number> = {}
        orders.forEach(order => {
          if (order.user_id) {
            userOrderCounts[order.user_id] = (userOrderCounts[order.user_id] || 0) + 1
          }
        })
        const newCustomers = Object.values(userOrderCounts).filter(count => count === 1).length
        const returningCustomers = Object.values(userOrderCounts).filter(count => count > 1).length
        const totalCustomers = newCustomers + returningCustomers

        setNewCustomersCount(newCustomers)
        setReturningCustomersRate(totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0)

        // Calculate Top Selling Items (by revenue)
        const itemRevenue: Record<string, number> = {}
        orders.forEach(order => {
          order.order_items?.forEach((item: any) => {
            if (item.item_id && menuItemsMap[item.item_id]) {
              const menuItem = menuItemsMap[item.item_id]
              const revenue = (item.price || menuItem.price || 0) * item.quantity
              itemRevenue[menuItem.name] = (itemRevenue[menuItem.name] || 0) + revenue
            }
          })
        })

        const sortedItemsByRevenue = Object.entries(itemRevenue)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)

        setTopSellingItemsLabels(sortedItemsByRevenue.map(([name]) => name))
        setTopSellingItemsData(sortedItemsByRevenue.map(([,revenue]) => Math.round(revenue)))

        // Calculate Item Ratings
        const itemRatings: Record<string, { total: number, count: number }> = {}
        orders.forEach(order => {
          if (order.rating && order.order_items) {
            order.order_items.forEach((item: any) => {
              if (item.item_id && menuItemsMap[item.item_id]) {
                const itemName = menuItemsMap[item.item_id].name
                if (!itemRatings[itemName]) {
                  itemRatings[itemName] = { total: 0, count: 0 }
                }
                itemRatings[itemName].total += order.rating
                itemRatings[itemName].count += 1
              }
            })
          }
        })

        const sortedItemsByRating = Object.entries(itemRatings)
          .map(([name, data]) => [name, data.total / data.count] as [string, number])
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)

        setItemRatingsLabels(sortedItemsByRating.map(([name]) => name))
        setItemRatingsData(sortedItemsByRating.map(([,rating]) => Math.round(rating * 10) / 10))

        // Calculate Category Performance
        const categoryOrders: Record<string, number> = {}
        orders.forEach(order => {
          order.order_items?.forEach((item: any) => {
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
          .slice(0, 4)

        setCategoryPerformanceLabels(sortedCategories.map(([name]) => name))
        setCategoryPerformanceData(sortedCategories.map(([,count]) => count))

        // Calculate Menu Efficiency
        const preparedOrders = orders.filter(order =>
          (order.status === 'completed' || order.status === 'ready') && order.updated_at
        )
        if (preparedOrders.length > 0) {
          const preparationTimes = preparedOrders.map(order => {
            const created = new Date(order.created_at).getTime()
            const updated = new Date(order.updated_at).getTime()
            return (updated - created) / (1000 * 60) // Convert to minutes
          })
          const avgPreparationTime = preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length
          setMenuEfficiencyTime(Math.round(avgPreparationTime * 10) / 10)
        } else {
          setMenuEfficiencyTime(0)
        }
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      // Set fallback data
      setOrderData([])
      setRevenueData([])
      setUserActivityData([])
      setLabels([])
      setPopularItemsData([])
      setPopularItemsLabels([])
      setPeakHoursData([])
      setCustomerSatisfactionData([0, 0, 0])
      setAverageOrderValueData([])
      setAverageOrderValueLabels([])
      setOrderFulfillmentTime(0)
      setOrderCompletionRate(0)
      setNewCustomersCount(0)
      setReturningCustomersRate(0)
      setTopSellingItemsData([])
      setTopSellingItemsLabels([])
      setItemRatingsData([])
      setItemRatingsLabels([])
      setCategoryPerformanceData([])
      setCategoryPerformanceLabels([])
      setMenuEfficiencyTime(0)
    }
  }

  // Initialize with last 30 days for better trend analysis
  useEffect(() => {
    const initialRange = predefinedRanges.last30Days
    setDateRange(initialRange)
    fetchAnalyticsData(initialRange)
  }, [])

  // Update data when date range changes
  useEffect(() => {
    if (!dateRange?.from) return

    setIsLoading(true)
    const loadData = async () => {
      try {
        await fetchAnalyticsData(dateRange)
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setIsLoading(false)
        setIsInitialLoading(false)
      }
    }

    loadData()
  }, [dateRange, user?.id])

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <CafeteriaPageHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive insights into your cafeteria's performance"
      />

      <div className="flex justify-end items-center gap-4 animate-slide-in-up">
        <div className="flex flex-col md:flex-row gap-4">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} className="w-full md:w-auto glass-effect border-white/20 hover:border-emerald-500/50 btn-modern" />
          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={() => fetchAnalyticsData()} disabled={isLoading} className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        <TabsList className="grid w-full grid-cols-4 glass-effect border border-white/20 p-1 h-auto rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Overview</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Orders</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Customers</TabsTrigger>
          <TabsTrigger value="menu" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Menu Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6" data-tab="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading || isInitialLoading ? (
              <>
                <ChartSkeleton type="line" title="Orders" description="Daily order count" />
                <ChartSkeleton type="bar" title="Revenue" description="Daily revenue in EGP" />
                <ChartSkeleton type="pie" title="Popular Items" description="Most ordered items" />
                <ChartSkeleton type="bar" title="Peak Hours" description="Orders by time of day" />
              </>
            ) : (
              <>
                <div className="chart-container chart-fade-in">
                  <Charts
                    title="Orders"
                    description="Daily order count"
                    type="line"
                    data={orderData}
                    labels={labels}
                    {...getChartColors('line')}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container chart-slide-up">
                  <Charts
                    title="Revenue"
                    description="Daily revenue in EGP"
                    type="bar"
                    data={revenueData}
                    labels={labels}
                    backgroundColor={colors.secondary}
                    borderColor={colors.secondary}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container chart-fade-in">
                  <Charts
                    title="Popular Items"
                    description="Most ordered items"
                    type="pie"
                    data={popularItemsData}
                    labels={popularItemsLabels}
                    {...getChartColors('pie', popularItemsData.length)}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container chart-slide-up">
                  <Charts
                    title="Peak Hours"
                    description="Orders by time of day"
                    type="bar"
                    data={peakHoursData}
                    labels={peakHoursLabels}
                    {...getChartColors('bar', peakHoursData.length)}
                    className="chart-title"
                  />
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6" data-tab="orders">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading || isInitialLoading ? (
              <>
                <ChartSkeleton type="line" title="Order Volume" description="Orders over time" />
                <ChartSkeleton type="bar" title="Average Order Value" description="Average spending per order" />
              </>
            ) : (
              <>
                <div className="chart-container">
                  <Charts
                    title="Order Volume"
                    description="Orders over time"
                    type="line"
                    data={orderData}
                    labels={labels}
                    {...getChartColors('line')}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container">
                  <Charts
                    title="Average Order Value"
                    description="Average spending per order"
                    type="bar"
                    data={averageOrderValueData}
                    labels={averageOrderValueLabels}
                    backgroundColor={colors.tertiary}
                    borderColor={colors.tertiary}
                    className="chart-title"
                  />
                </div>
              </>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Order Fulfillment</CardTitle>
                <CardDescription>Time to fulfill orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isInitialLoading ? (
                  <>
                    <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{orderFulfillmentTime} minutes</p>
                    <p className="text-sm text-muted-foreground">Average fulfillment time</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order Completion Rate</CardTitle>
                <CardDescription>Successfully completed orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isInitialLoading ? (
                  <>
                    <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{orderCompletionRate}%</p>
                    <p className="text-sm text-muted-foreground">Successfully completed orders</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6" data-tab="customers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading || isInitialLoading ? (
              <>
                <ChartSkeleton type="line" title="User Activity" description="Daily active users" />
                <ChartSkeleton type="doughnut" title="Customer Satisfaction" description="Feedback ratings" />
              </>
            ) : (
              <>
                <div className="chart-container">
                  <Charts
                    title="User Activity"
                    description="Daily active users"
                    type="line"
                    data={userActivityData}
                    labels={labels}
                    backgroundColor={colors.quaternary}
                    borderColor={colors.quaternary}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container">
                  <Charts
                    title="Customer Satisfaction"
                    description="Feedback ratings"
                    type="doughnut"
                    data={customerSatisfactionData}
                    labels={customerSatisfactionLabels}
                    {...getChartColors('pie', customerSatisfactionData.length)}
                    className="chart-title"
                  />
                </div>
              </>
            )}
            <Card>
              <CardHeader>
                <CardTitle>New Customers</CardTitle>
                <CardDescription>First-time orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isInitialLoading ? (
                  <>
                    <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{newCustomersCount}</p>
                    <p className="text-sm text-muted-foreground">First-time customers in period</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Returning Customers</CardTitle>
                <CardDescription>Repeat order rate</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isInitialLoading ? (
                  <>
                    <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{returningCustomersRate}%</p>
                    <p className="text-sm text-muted-foreground">Repeat customer rate</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6" data-tab="menu">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading || isInitialLoading ? (
              <>
                <ChartSkeleton type="bar" title="Top Selling Items" description="Most popular menu items" />
                <ChartSkeleton type="bar" title="Item Ratings" description="Average customer ratings" />
                <ChartSkeleton type="pie" title="Category Performance" description="Orders by category" />
              </>
            ) : (
              <>
                <div className="chart-container">
                  <Charts
                    title="Top Selling Items"
                    description="Highest revenue generating items"
                    type="bar"
                    data={topSellingItemsData}
                    labels={topSellingItemsLabels}
                    {...getChartColors('bar', topSellingItemsData.length)}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container">
                  <Charts
                    title="Item Ratings"
                    description="Average customer ratings"
                    type="bar"
                    data={itemRatingsData}
                    labels={itemRatingsLabels}
                    backgroundColor={colors.accent2}
                    borderColor={colors.accent2}
                    className="chart-title"
                  />
                </div>
                <div className="chart-container">
                  <Charts
                    title="Category Performance"
                    description="Orders by category"
                    type="pie"
                    data={categoryPerformanceData}
                    labels={categoryPerformanceLabels}
                    {...getChartColors('pie', categoryPerformanceData.length)}
                    className="chart-title"
                  />
                </div>
              </>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Menu Efficiency</CardTitle>
                <CardDescription>Preparation time analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isInitialLoading ? (
                  <>
                    <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{menuEfficiencyTime} minutes</p>
                    <p className="text-sm text-muted-foreground">Average preparation time</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
