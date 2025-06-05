"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Charts } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CafeteriaPageHeader } from "@/components/cafeteria/page-header"

import { formatCurrency } from "@/lib/currency"
import { supabase } from "@/lib/supabase"

// Types for dashboard data
interface DashboardMetrics {
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

interface ChartData {
  revenue: number[]
  orders: number[]
  customers: number[]
  months: string[]
  dailyRevenue: number[]
  dailyOrders: number[]
  days: string[]
}
import {
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  Users,
  ShoppingCart,
  DollarSign,
  Coffee,
} from "lucide-react"

export default function CafeteriaDashboard() {
  const [timeRange, setTimeRange] = useState("This Month")
  const [chartView, setChartView] = useState("revenue")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cafeteriaId, setCafeteriaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dashboard data state
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
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
  })

  const [chartData, setChartData] = useState<ChartData>({
    revenue: [],
    orders: [],
    customers: [],
    months: [],
    dailyRevenue: [],
    dailyOrders: [],
    days: []
  })

  // Fetch dashboard data from Supabase
  const fetchDashboardData = async () => {
    try {
      console.log('🚀 Starting fetchDashboardData...')
      setIsLoading(true)
      setError(null)

      // ALWAYS get cafeteria ID from the current logged-in user (don't trust cached state)
      console.log('🔍 Getting cafeteria ID from current user...')

      // Get current user's cafeteria ID
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Authentication error:', authError)
        throw new Error('Please sign in to access your cafeteria dashboard')
      }

      console.log('✅ User authenticated:', user.email)

      // Get cafeteria owned by this user
      const { data: cafeteria, error: cafeteriaError } = await supabase
        .from('cafeterias')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .single()

      if (cafeteriaError || !cafeteria) {
        console.error('❌ No cafeteria found for user:', cafeteriaError)
        throw new Error('No cafeteria found for your account. Please contact support.')
      }

      console.log('✅ Found cafeteria for user:', cafeteria.name, cafeteria.id)
      const currentCafeteriaId = cafeteria.id
      setCafeteriaId(currentCafeteriaId)

      console.log('🏪 Using cafeteria ID:', currentCafeteriaId)

      // Use the new cafeteria-specific metrics API
      const params = new URLSearchParams({
        timeRange: timeRange,
        cafeteriaId: currentCafeteriaId
      })

      const apiUrl = `/api/cafeteria/metrics?${params.toString()}`
      console.log('📡 Calling cafeteria metrics API:', apiUrl)

      // Fetch data from the new cafeteria metrics API
      const response = await fetch(apiUrl)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      console.log("✅ Cafeteria metrics API response:", data)

      // Use the real metrics from the API
      setDashboardMetrics(data.metrics)

      // Use chart data from API if available, otherwise create empty structure
      if (data.chartData) {
        setChartData({
          revenue: data.chartData.revenue || new Array(12).fill(0),
          orders: data.chartData.orders || new Array(12).fill(0),
          customers: data.chartData.customers || new Array(12).fill(0),
          months: data.chartData.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          dailyRevenue: [],
          dailyOrders: [],
          days: []
        })
      } else {
        // Fallback: Generate proper chart data structure to avoid chart errors
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        const emptyMonthlyData = new Array(12).fill(0)

        setChartData({
          revenue: emptyMonthlyData,
          orders: emptyMonthlyData,
          customers: emptyMonthlyData,
          months: months,
          dailyRevenue: [],
          dailyOrders: [],
          days: []
        })
      }

      toast({
        title: "Dashboard Updated",
        description: `Loaded data for ${timeRange.toLowerCase()}`,
      })

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setError("Failed to load dashboard data")
      toast({
        title: "Error loading dashboard",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  // Handle export data
  const handleExportData = () => {
    toast({
      title: "Exporting dashboard data",
      description: "Your data export has started and will be ready shortly.",
    })
  }

  // Handle refresh data
  const handleRefreshData = async () => {
    setIsRefreshing(true)
    toast({
      title: "Refreshing dashboard",
      description: "Fetching the latest data...",
    })

    try {
      await fetchDashboardData()
      toast({
        title: "Dashboard refreshed",
        description: "Dashboard data has been updated with the latest information.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was an error refreshing your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle time range change
  const handleTimeRangeChange = async (value: string) => {
    toast({
      title: "Updating time range",
      description: `Loading data for: ${value}...`,
    })

    setTimeRange(value)
    toast({
      title: "Time range updated",
      description: `Dashboard now showing data for: ${value}`,
    })
  }

  // Handle chart view change
  const handleChartViewChange = (view: string) => {
    toast({
      title: "Changing view",
      description: `Loading ${view} data...`,
    })

    setTimeout(() => {
      setChartView(view)
      toast({
        title: "Chart view changed",
        description: `Now showing ${view} data`,
      })
    }, 800)
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Coffee className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-white mb-2">Dashboard Error</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <CafeteriaPageHeader
        title="Dashboard Overview"
        subtitle="Real-time data from your cafeteria"
      />

      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-3 animate-slide-in-right">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern transition-all duration-300">
                  <Calendar className="mr-2 h-4 w-4" />
                  {timeRange}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleTimeRangeChange("Today")}>Today</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeRangeChange("This Week")}>This Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeRangeChange("This Month")}>This Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeRangeChange("This Quarter")}>This Quarter</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTimeRangeChange("This Year")}>This Year</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern transition-all duration-300"
              onClick={handleRefreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>

            <Button variant="outline" className="glass-effect border-white/20 hover:border-purple-500/50 btn-modern transition-all duration-300" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="modern-card glass-effect overflow-hidden group hover-lift animate-scale-in stagger-1">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm mb-2 font-medium text-slate-400">Today's Orders</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-16 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{dashboardMetrics.todayOrders}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Orders today</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "75%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect overflow-hidden group hover-lift animate-scale-in stagger-2">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm mb-2 font-medium text-slate-400">Today's Revenue</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-20 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{formatCurrency(dashboardMetrics.todayRevenue)}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float" style={{ animationDelay: '0.5s' }}>
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Revenue today</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "80%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect overflow-hidden group hover-lift animate-scale-in stagger-3">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm mb-2 font-medium text-slate-400">Customers</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-24 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{dashboardMetrics.todayCustomers}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float" style={{ animationDelay: '1s' }}>
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Unique customers</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "60%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect overflow-hidden group hover-lift animate-scale-in stagger-4">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm mb-2 font-medium text-slate-400">Menu Items</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-28 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{dashboardMetrics.totalMenuItems}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float" style={{ animationDelay: '1.5s' }}>
                  <Coffee size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Total items</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "90%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="modern-card glass-effect hover-lift animate-slide-in-left">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold gradient-text">
                  Monthly {chartView.charAt(0).toUpperCase() + chartView.slice(1)}
                </h3>
                <Select defaultValue={chartView} onValueChange={handleChartViewChange}>
                  <SelectTrigger className="w-[180px] glass-effect border-white/20 hover:border-emerald-500/50 btn-modern">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent className="glass-effect border-white/20">
                    <SelectItem value="revenue" className="hover:bg-emerald-500/20">Revenue</SelectItem>
                    <SelectItem value="orders" className="hover:bg-purple-500/20">Orders</SelectItem>
                    <SelectItem value="customers" className="hover:bg-blue-500/20">Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoading ? (
                <div className="h-[280px] rounded-xl loading-shimmer"></div>
              ) : (
                <div className="chart-container chart-fade-in">
                  <Charts
                    title=""
                    description=""
                    type="bar"
                    data={
                      chartView === "revenue"
                        ? chartData.revenue
                        : chartView === "orders"
                          ? chartData.orders
                          : chartData.customers
                    }
                    labels={chartData.months.length > 0 ? chartData.months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
                    backgroundColor={chartView === "revenue" ? "rgba(16, 185, 129, 0.1)" : chartView === "orders" ? "rgba(139, 92, 246, 0.1)" : "rgba(59, 130, 246, 0.1)"}
                    borderColor={chartView === "revenue" ? "#10b981" : chartView === "orders" ? "#8b5cf6" : "#3b82f6"}
                    className="chart-title"
                  />
                </div>
              )}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-2xl"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect hover-lift animate-slide-in-right">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold gradient-text">Popular Items</h3>
                <Button variant="outline" className="glass-effect border-white/20 hover:border-purple-500/50 btn-modern" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              {isLoading ? (
                <div className="h-[280px] rounded-xl loading-shimmer"></div>
              ) : (
                <div className="chart-container chart-fade-in">
                  {dashboardMetrics.topSellingItems.length > 0 ? (
                    <Charts
                      title=""
                      description=""
                      type="pie"
                      data={dashboardMetrics.topSellingItems.map(item => item.orders)}
                      labels={dashboardMetrics.topSellingItems.map(item => item.name)}
                      backgroundColor={[
                        "rgba(245, 158, 11, 0.9)",   // Amber
                        "rgba(16, 185, 129, 0.9)",   // Emerald
                        "rgba(129, 140, 248, 0.9)",  // Indigo
                        "rgba(249, 115, 22, 0.9)",   // Orange
                        "rgba(6, 182, 212, 0.9)",    // Cyan
                        "rgba(168, 85, 247, 0.9)",   // Purple
                        "rgba(236, 72, 153, 0.9)",   // Pink
                        "rgba(34, 197, 94, 0.9)",    // Green
                        "rgba(239, 68, 68, 0.9)",    // Red
                        "rgba(59, 130, 246, 0.9)"    // Blue
                      ]}
                      borderColor={[
                        "#f59e0b",  // Amber
                        "#10b981",  // Emerald
                        "#818cf8",  // Indigo
                        "#f97316",  // Orange
                        "#06b6d4",  // Cyan
                        "#a855f7",  // Purple
                        "#ec4899",  // Pink
                        "#22c55e",  // Green
                        "#ef4444",  // Red
                        "#3b82f6"   // Blue
                      ]}
                      height={280}
                      className="chart-title"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-slate-400">
                      <div className="text-center">
                        <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sales data available</p>
                        <p className="text-sm">Start taking orders to see popular items</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-full blur-2xl"></div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
