"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Charts } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { formatCurrency } from "@/lib/currency"
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

// Types for dashboard data
interface DashboardMetrics {
  todayOrders: number
  todayRevenue: number
  todayCustomers: number
  totalMenuItems: number
}

interface ChartData {
  revenue: number[]
  orders: number[]
  customers: number[]
  months: string[]
}

export default function CafeteriaDashboard() {
  const [timeRange, setTimeRange] = useState("This Month")
  const [chartView, setChartView] = useState("revenue")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Dashboard data state
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    todayOrders: 0,
    todayRevenue: 0,
    todayCustomers: 0,
    totalMenuItems: 0,
  })

  const [chartData, setChartData] = useState<ChartData>({
    revenue: [],
    orders: [],
    customers: [],
    months: [],
  })

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock data for cafeteria dashboard
      const mockMetrics: DashboardMetrics = {
        todayOrders: 45,
        todayRevenue: 1250.75,
        todayCustomers: 38,
        totalMenuItems: 24,
      }

      const mockChartData: ChartData = {
        revenue: [2800, 3200, 2900, 3500, 4100, 3800, 4200, 3900, 3600, 4000, 3700, 3900],
        orders: [120, 135, 128, 145, 160, 152, 168, 155, 142, 158, 148, 155],
        customers: [95, 108, 102, 118, 125, 120, 132, 122, 115, 128, 118, 125],
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      }

      setDashboardMetrics(mockMetrics)
      setChartData(mockChartData)

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

  return (
    <div className="p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold gradient-text">Dashboard Overview</h1>

          <div className="mt-4 md:mt-0 flex gap-3 animate-slide-in-right">
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
                  <Charts
                    title=""
                    description=""
                    type="pie"
                    data={[25, 20, 18, 15, 12, 10, 8, 6]}
                    labels={["Pizza", "Burger", "Sandwich", "Salad", "Coffee", "Pasta", "Soup", "Dessert"]}
                    backgroundColor={[
                      "rgba(245, 158, 11, 0.8)",
                      "rgba(16, 185, 129, 0.8)",
                      "rgba(129, 140, 248, 0.8)",
                      "rgba(249, 115, 22, 0.8)",
                      "rgba(6, 182, 212, 0.8)",
                      "rgba(168, 85, 247, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                      "rgba(34, 197, 94, 0.8)"
                    ]}
                    borderColor={[
                      "#f59e0b",
                      "#10b981",
                      "#818cf8",
                      "#f97316",
                      "#06b6d4",
                      "#a855f7",
                      "#ec4899",
                      "#22c55e"
                    ]}
                    className="chart-title"
                  />
                </div>
              )}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-full blur-2xl"></div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
