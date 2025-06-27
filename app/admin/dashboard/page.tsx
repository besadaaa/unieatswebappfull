"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Charts } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/admin/page-header"

import { formatCurrency } from "@/lib/currency"
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  RefreshCw,
  Users,
  ShoppingCart,
  DollarSign,
  Store,
} from "lucide-react"

// Types for dashboard data
interface DashboardMetrics {
  totalCafeterias: number
  activeCafeterias: number
  totalUsers: number
  totalOrders: number
  totalOrderValue: number
  totalRevenue: number
  userServiceFees: number
  cafeteriaCommissions: number
}

interface ChartData {
  revenue: number[]
  orders: number[]
  users: number[]
  months: string[]
}

interface CafeteriaData {
  id: string
  name: string
  status: string
  users: number
  orders: number
  orderValue: number
  revenue: number
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("This Year")
  const [chartView, setChartView] = useState("revenue")
  const [cafeteriaFilter, setCafeteriaFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Dashboard data state
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalCafeterias: 0,
    activeCafeterias: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalOrderValue: 0,
    totalRevenue: 0,
    userServiceFees: 0,
    cafeteriaCommissions: 0,
  })

  const [chartData, setChartData] = useState<ChartData>({
    revenue: [],
    orders: [],
    users: [],
    months: [],
  })

  const [cafeterias, setCafeterias] = useState<CafeteriaData[]>([])
  const [selectedCafeteriaData, setSelectedCafeteriaData] = useState<CafeteriaData | null>(null)

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        timeRange,
        ...(cafeteriaFilter !== 'all' && { cafeteriaId: cafeteriaFilter })
      })

      // Fetch data from our dashboard API (with cache busting)
      const response = await fetch(`/api/dashboard?${params}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      // Update state with API response
      setDashboardMetrics(data.metrics)
      setChartData(data.charts)
      setCafeterias(data.cafeterias)

      console.log('🎯 Frontend Dashboard Data Received:', {
        totalRevenue: data.metrics.totalRevenue,
        totalOrderValue: data.metrics.totalOrderValue,
        totalOrders: data.metrics.totalOrders,
        timeRange: data.timeRange,
        fullMetrics: data.metrics
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
  }, [timeRange, cafeteriaFilter])

  // Update selected cafeteria data when filter changes
  useEffect(() => {
    if (cafeteriaFilter === "all") {
      setSelectedCafeteriaData(null)
    } else {
      const selected = cafeterias.find(c => c.name === cafeteriaFilter)
      setSelectedCafeteriaData(selected || null)
    }
  }, [cafeteriaFilter, cafeterias])

  // Handle export data
  const handleExportData = async () => {
    try {
      toast({
        title: "Exporting dashboard data",
        description: "Fetching real data from database...",
      })

      // Fetch real data from the dashboard API
      const response = await fetch(`/api/dashboard?timeRange=${encodeURIComponent(timeRange)}&cafeteriaId=${cafeteriaFilter}`)

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const dashboardData = await response.json()

      // Create comprehensive CSV content with real data
      const csvRows = []

      // Add summary metrics
      csvRows.push("Dashboard Summary")
      csvRows.push("Metric,Value")
      csvRows.push(`Total Cafeterias,${dashboardData.metrics?.totalCafeterias || 0}`)
      csvRows.push(`Active Cafeterias,${dashboardData.metrics?.activeCafeterias || 0}`)
      csvRows.push(`Total Users,${dashboardData.metrics?.totalUsers || 0}`)
      csvRows.push(`Total Orders,${dashboardData.metrics?.totalOrders || 0}`)
      csvRows.push(`Total Revenue,${dashboardData.metrics?.totalRevenue?.toFixed(2) || '0.00'} EGP`)
      csvRows.push(`User Service Fees,${dashboardData.metrics?.userServiceFees?.toFixed(2) || '0.00'} EGP`)
      csvRows.push(`Cafeteria Commissions,${dashboardData.metrics?.cafeteriaCommissions?.toFixed(2) || '0.00'} EGP`)
      csvRows.push("") // Empty row

      // Add chart data
      csvRows.push("Monthly Data")
      csvRows.push("Month,Revenue (EGP),Orders,Users")

      const months = dashboardData.charts?.months || []
      const revenue = dashboardData.charts?.revenue || []
      const orders = dashboardData.charts?.orders || []
      const users = dashboardData.charts?.users || []

      for (let i = 0; i < months.length; i++) {
        csvRows.push([
          months[i] || `Month ${i + 1}`,
          revenue[i]?.toFixed(2) || '0.00',
          orders[i] || 0,
          users[i] || 0
        ].join(","))
      }

      csvRows.push("") // Empty row

      // Add cafeteria data if available
      if (dashboardData.cafeterias && dashboardData.cafeterias.length > 0) {
        csvRows.push("Cafeterias")
        csvRows.push("Name,Location,Status,Rating")
        dashboardData.cafeterias.forEach(cafe => {
          csvRows.push([
            `"${cafe.name || 'Unknown'}"`,
            `"${cafe.location || 'Unknown'}"`,
            cafe.operational_status || 'unknown',
            cafe.rating?.toFixed(1) || '0.0'
          ].join(","))
        })
      }

      const csvContent = csvRows.join("\n")

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `dashboard-export-${timeRange.toLowerCase().replace(/\s/g, "-")}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export complete",
        description: "Real dashboard data has been exported successfully.",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      })
    }
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
    setTimeRange(value)
    // Data will be refetched automatically via useEffect
  }

  // Handle cafeteria filter change
  const handleCafeteriaFilterChange = (value: string) => {
    setCafeteriaFilter(value)
    // Data will be refetched automatically via useEffect
  }

  // Handle chart view change
  const handleChartViewChange = (view: string) => {
    // Show loading state
    toast({
      title: "Changing view",
      description: `Loading ${view} data...`,
    })

    // Simulate API call
    setTimeout(() => {
      setChartView(view)
      toast({
        title: "Chart view changed",
        description: `Now showing ${view} data`,
      })
    }, 800)
  }

  return (
    <div className="p-6 animate-fade-in">
        <PageHeader
          title="Dashboard Overview"
          subtitle="Monitor your platform's performance and key metrics"
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="mt-4 md:mt-0 flex gap-3 animate-slide-in-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="glass-effect border-white/20 hover:border-orange-500/50 btn-modern transition-all duration-300">
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
                <DropdownMenuItem onClick={() => handleTimeRangeChange("All Time")}>All Time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`glass-effect border-white/20 btn-modern transition-all duration-300 ${
                    cafeteriaFilter !== "all" ? "border-blue-500/50 text-blue-400 ring-2 ring-blue-500/20 animate-glow-pulse" : "hover:border-blue-500/50"
                  }`}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {cafeteriaFilter === "all"
                    ? "All Cafeterias"
                    : cafeterias.find(c => c.id === cafeteriaFilter)?.name || cafeteriaFilter}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleCafeteriaFilterChange("all")}
                  className={cafeteriaFilter === "all" ? "bg-blue-500/20 text-blue-500" : ""}
                >
                  All Cafeterias
                </DropdownMenuItem>
                {cafeterias.map((cafeteria) => (
                  <DropdownMenuItem
                    key={cafeteria.id}
                    onClick={() => handleCafeteriaFilterChange(cafeteria.id)}
                    className={cafeteriaFilter === cafeteria.id ? "bg-blue-500/20 text-blue-500" : ""}
                  >
                    {cafeteria.name}
                  </DropdownMenuItem>
                ))}
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
                  <div className="text-sm mb-2 font-medium text-slate-400">Total Cafeterias</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-16 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{dashboardMetrics.activeCafeterias}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float">
                  <Store size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Active cafeterias</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "100%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect overflow-hidden group hover-lift animate-scale-in stagger-2">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm mb-2 font-medium text-slate-400">Active Users</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-20 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{(selectedCafeteriaData?.users || dashboardMetrics.totalUsers).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float" style={{ animationDelay: '0.5s' }}>
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Registered users</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "75%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect overflow-hidden group hover-lift animate-scale-in stagger-3">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm mb-2 font-medium text-slate-400">Total Orders</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-24 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{(selectedCafeteriaData?.orders || dashboardMetrics.totalOrders).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float" style={{ animationDelay: '1s' }}>
                  <ShoppingCart size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">All time orders</div>
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
                  <div className="text-sm mb-2 font-medium text-slate-400">Revenue</div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="h-8 w-28 rounded loading-shimmer"></div>
                    ) : (
                      <span className="animate-bounce-in">{formatCurrency(selectedCafeteriaData?.revenue || dashboardMetrics.totalRevenue)}</span>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-float" style={{ animationDelay: '1.5s' }}>
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-400 font-medium animate-pulse">Total revenue</div>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 animate-shimmer" style={{ width: "80%" }}></div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
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
                  <SelectTrigger className="w-[180px] glass-effect border-white/20 hover:border-orange-500/50 btn-modern">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent className="glass-effect border-white/20">
                    <SelectItem value="revenue" className="hover:bg-emerald-500/20">Revenue</SelectItem>
                    <SelectItem value="orders" className="hover:bg-purple-500/20">Orders</SelectItem>
                    <SelectItem value="users" className="hover:bg-blue-500/20">Users</SelectItem>
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
                          : chartData.users
                    }
                    labels={chartData.months.length > 0 ? chartData.months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
                    backgroundColor={chartView === "revenue" ? "rgba(16, 185, 129, 0.1)" : chartView === "orders" ? "rgba(139, 92, 246, 0.1)" : "rgba(59, 130, 246, 0.1)"}
                    borderColor={chartView === "revenue" ? "#10b981" : chartView === "orders" ? "#8b5cf6" : "#3b82f6"}
                    className="chart-title"
                  />
                </div>
              )}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-full blur-2xl"></div>
            </CardContent>
          </Card>

          <Card className="modern-card glass-effect hover-lift animate-slide-in-right">
            <CardContent className="p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold gradient-text">Revenue by Cafeteria</h3>
                <Button variant="outline" className="glass-effect border-white/20 hover:border-purple-500/50 btn-modern" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              {isLoading ? (
                <div className="h-[280px] rounded-xl loading-shimmer"></div>
              ) : (
                <div className="chart-container chart-fade-in">
                  <Charts
                    title=""
                    description=""
                    type="pie"
                    data={cafeterias.length > 0 ? cafeterias.map(c => c.revenue) : [100]}
                    labels={cafeterias.length > 0 ? cafeterias.map(c => c.name) : ["No Data"]}
                    backgroundColor={[
                      "rgba(245, 158, 11, 0.8)",
                      "rgba(16, 185, 129, 0.8)",
                      "rgba(129, 140, 248, 0.8)",
                      "rgba(249, 115, 22, 0.8)",
                      "rgba(6, 182, 212, 0.8)"
                    ]}
                    borderColor={[
                      "#f59e0b",
                      "#10b981",
                      "#818cf8",
                      "#f97316",
                      "#06b6d4"
                    ]}
                    className="chart-title"
                  />
                </div>
              )}

              {!isLoading && (
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {cafeterias.length > 0 ? (
                    cafeterias.map((cafeteria, index) => {
                      const colors = ["#f59e0b", "#10b981", "#818cf8", "#f97316", "#06b6d4"]
                      const percentage = dashboardMetrics.totalRevenue > 0
                        ? Math.round((cafeteria.revenue / dashboardMetrics.totalRevenue) * 100)
                        : 0

                      return (
                        <div key={cafeteria.id} className="flex items-center gap-3 p-2 rounded-lg glass-effect hover:bg-white/5 transition-all duration-300 animate-slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div
                            className="w-4 h-4 rounded-full animate-pulse"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          ></div>
                          <span className="text-sm font-medium text-slate-300">{cafeteria.name}: <span className="text-white">{percentage}%</span></span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-2 text-center text-slate-400 text-sm animate-fade-in">
                      No cafeteria data available
                    </div>
                  )}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-2xl"></div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
