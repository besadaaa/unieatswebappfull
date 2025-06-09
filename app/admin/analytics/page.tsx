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
import { PageHeader } from "@/components/admin/page-header"

// Error boundary component for analytics
function AnalyticsErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Analytics page error:', error)
      setHasError(true)
      setError(new Error(error.message))
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#0f1424] text-white p-6">
        <PageHeader
          title="Analytics"
          description="Platform performance and insights"
        />
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="bg-red-900/20 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-400">Analytics Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300 mb-4">Failed to load analytics:</p>
              <pre className="bg-red-950 p-4 rounded text-sm overflow-auto text-red-200">
                {error?.message || 'Unknown error occurred'}
              </pre>
              <Button
                onClick={() => {
                  setHasError(false)
                  setError(null)
                  window.location.reload()
                }}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function AnalyticsPageContent() {
  // Get theme-aware colors
  const { colors, PIE_CHART_COLORS, BAR_CHART_COLORS, generateBackgroundColors } = useChartColors()

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

  // Fetch analytics data from API
  const fetchAnalyticsData = async (selectedDateRange?: DateRange) => {
    try {
      const dateFilter = selectedDateRange || dateRange
      const startDate = dateFilter?.from ? dateFilter.from.toISOString().split('T')[0] : null
      const endDate = dateFilter?.to ? dateFilter.to.toISOString().split('T')[0] : null

      console.log('🔍 Fetching analytics data for date range:', { startDate, endDate })

      // Call the analytics API
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/analytics?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data')
      }

      const analyticsData = result.data
      console.log('📊 Analytics data received:', analyticsData)

      // Update all state with the received data
      setOrderData(analyticsData.orders || [])
      setRevenueData(analyticsData.revenue || [])
      setUserActivityData(analyticsData.userActivity || [])
      setLabels(analyticsData.labels || [])
      setPopularItemsData(analyticsData.popularItems?.data || [])
      setPopularItemsLabels(analyticsData.popularItems?.labels || [])
      setPeakHoursData(analyticsData.peakHours?.data || [])
      setCustomerSatisfactionData(analyticsData.customerSatisfaction?.data || [0, 0, 0])
      setAverageOrderValueData(analyticsData.averageOrderValue?.data || [])
      setAverageOrderValueLabels(analyticsData.averageOrderValue?.labels || [])
      setOrderFulfillmentTime(analyticsData.metrics?.orderFulfillmentTime || 0)
      setOrderCompletionRate(analyticsData.metrics?.orderCompletionRate || 0)
      setNewCustomersCount(analyticsData.metrics?.newCustomersCount || 0)
      setReturningCustomersRate(analyticsData.metrics?.returningCustomersRate || 0)
      setTopSellingItemsData(analyticsData.topSellingItems?.data || [])
      setTopSellingItemsLabels(analyticsData.topSellingItems?.labels || [])
      setItemRatingsData(analyticsData.itemRatings?.data || [])
      setItemRatingsLabels(analyticsData.itemRatings?.labels || [])
      setCategoryPerformanceData(analyticsData.categoryPerformance?.data || [])
      setCategoryPerformanceLabels(analyticsData.categoryPerformance?.labels || [])
      setMenuEfficiencyTime(analyticsData.menuEfficiencyTime || 0)

      console.log('✅ Analytics data updated successfully')









    } catch (error) {
      console.error('❌ Error fetching analytics data:', error)
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

  // Update comparison date range when primary date range changes or comparison is toggled
  useEffect(() => {
    if (comparisonEnabled && dateRange?.from) {
      setComparisonDateRange(calculatePreviousPeriod(dateRange))
    }
  }, [dateRange, comparisonEnabled])

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0)
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = prev + Math.random() * 15
          return next > 100 ? 100 : next
        })
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isLoading])

  // Update data when date range changes
  useEffect(() => {
    if (!dateRange?.from) return

    setIsLoading(true)

    // Fetch real data from Supabase
    const loadData = async () => {
      try {
        await fetchAnalyticsData(dateRange)

        // Generate comparison data if enabled
        if (comparisonEnabled && comparisonDateRange?.from) {
          // For comparison, we'll fetch data for the comparison period
          // This is a simplified approach - in a real app you'd want to optimize this
          const comparisonData = await fetchComparisonData(comparisonDateRange)
          setComparisonOrderData(comparisonData.orders)
          setComparisonRevenueData(comparisonData.revenue)
          setComparisonUserActivityData(comparisonData.userActivity)
          setComparisonLabels(comparisonData.labels)
        }
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setIsLoading(false)
        setIsInitialLoading(false)
      }
    }

    loadData()
  }, [dateRange, comparisonEnabled, comparisonDateRange])

  // Helper function to fetch comparison data
  const fetchComparisonData = async (compDateRange: DateRange) => {
    try {
      const startDate = compDateRange.from?.toISOString().split('T')[0]
      const endDate = compDateRange.to?.toISOString().split('T')[0]

      let ordersQuery = supabase
        .from('orders')
        .select('id, created_at, total_amount, admin_revenue')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true })

      if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate)
      if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate + 'T23:59:59')

      const { data: orders } = await ordersQuery

      if (orders) {
        const dateMap = new Map<string, { orders: number, revenue: number, users: Set<string> }>()

        orders.forEach(order => {
          const date = order.created_at.split('T')[0]
          if (!dateMap.has(date)) {
            dateMap.set(date, { orders: 0, revenue: 0, users: new Set() })
          }
          const dayData = dateMap.get(date)!
          dayData.orders += 1
          dayData.revenue += parseFloat(order.admin_revenue) || 0
          dayData.users.add(order.id)
        })

        const sortedDates = Array.from(dateMap.keys()).sort()
        return {
          orders: sortedDates.map(date => dateMap.get(date)!.orders),
          revenue: sortedDates.map(date => dateMap.get(date)!.revenue),
          userActivity: sortedDates.map(date => dateMap.get(date)!.users.size),
          labels: sortedDates.map(date => format(new Date(date), "MMM dd"))
        }
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error)
    }

    return { orders: [], revenue: [], userActivity: [], labels: [] }
  }

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsLoading(true)

    try {
      // Refresh real analytics data
      await fetchAnalyticsData(dateRange)

      // Refresh comparison data if enabled
      if (comparisonEnabled && comparisonDateRange?.from) {
        const comparisonData = await fetchComparisonData(comparisonDateRange)
        setComparisonOrderData(comparisonData.orders)
        setComparisonRevenueData(comparisonData.revenue)
        setComparisonUserActivityData(comparisonData.userActivity)
        setComparisonLabels(comparisonData.labels)
      }

    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle predefined date range selection
  const selectPredefinedRange = (range: DateRange) => {
    setDateRange(range)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Handle comparison toggle
  const handleComparisonToggle = (enabled: boolean) => {
    setComparisonEnabled(enabled)
    if (enabled && dateRange?.from) {
      setComparisonDateRange(calculatePreviousPeriod(dateRange))
    }
  }

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate summary metrics
  const orderSummary = comparisonEnabled ? generateComparisonSummary(orderData, comparisonOrderData) : null

  const revenueSummary = comparisonEnabled ? generateComparisonSummary(revenueData, comparisonRevenueData) : null

  const userActivitySummary = comparisonEnabled
    ? generateComparisonSummary(userActivityData, comparisonUserActivityData)
    : null

  // Add new function to handle exports from the main dropdown
  const handleExport = async (type: "csv" | "excel" | "pdf") => {
    setIsExporting(true)

    try {
      switch (type) {
        case "csv":
          // Export all datasets as CSV
          const datasets = [
            { title: "Orders", data: orderData, labels },
            { title: "Revenue", data: revenueData, labels },
            { title: "User Activity", data: userActivityData, labels },
            { title: "Popular Items", data: popularItemsData, labels: popularItemsLabels },
            { title: "Peak Hours", data: peakHoursData, labels: peakHoursLabels },
          ]

          exportChartDataAsExcel(
            datasets,
            `unieats-analytics-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`,
          )
          break

        case "pdf":
          // Get all chart container IDs in the active tab
          const tabContent = document.querySelector(`[data-tab="${activeTab}"]`)
          if (!tabContent) break

          const chartContainers = tabContent.querySelectorAll(".chart-container")
          const chartIds = Array.from(chartContainers)
            .map((container) => container.id)
            .filter(Boolean)

          await exportChartsAsPDF(
            chartIds,
            `UniEats ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analytics`,
            `unieats-${activeTab}-analytics-${new Date().toISOString().split("T")[0]}.pdf`,
          )
          break
      }
    } catch (error) {
      console.error(`Error exporting as ${type}:`, error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive insights into your platform's performance"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-in-up">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} className="w-full md:w-auto glass-effect border-white/20 hover:border-blue-500/50 btn-modern" />

          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isExporting} className="glass-effect border-white/20 hover:border-purple-500/50 btn-modern">
                  {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect border-white/20">
                <DropdownMenuLabel className="gradient-text">Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("csv")} className="hover:bg-emerald-500/20">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("excel")} className="hover:bg-blue-500/20">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Export as Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("pdf")} className="hover:bg-red-500/20">
                  <FilePdf className="mr-2 h-4 w-4" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={
              dateRange &&
              dateRange.from?.toDateString() === predefinedRanges.last7Days.from.toDateString() &&
              dateRange.to?.toDateString() === predefinedRanges.last7Days.to.toDateString()
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => selectPredefinedRange(predefinedRanges.last7Days)}
            className="glass-effect border-white/20 hover:border-blue-500/50 btn-modern"
          >
            Last 7 Days
          </Button>
          <Button
            variant={
              dateRange &&
              dateRange.from?.toDateString() === predefinedRanges.last30Days.from.toDateString() &&
              dateRange.to?.toDateString() === predefinedRanges.last30Days.to.toDateString()
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => selectPredefinedRange(predefinedRanges.last30Days)}
            className="glass-effect border-white/20 hover:border-blue-500/50 btn-modern"
          >
            Last 30 Days
          </Button>
          <Button
            variant={
              dateRange &&
              dateRange.from?.toDateString() === predefinedRanges.thisMonth.from.toDateString() &&
              dateRange.to?.toDateString() === predefinedRanges.thisMonth.to.toDateString()
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => selectPredefinedRange(predefinedRanges.thisMonth)}
            className="glass-effect border-white/20 hover:border-green-500/50 btn-modern"
          >
            This Month
          </Button>
          <Button
            variant={
              dateRange &&
              dateRange.from?.toDateString() === predefinedRanges.lastMonth.from.toDateString() &&
              dateRange.to?.toDateString() === predefinedRanges.lastMonth.to.toDateString()
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => selectPredefinedRange(predefinedRanges.lastMonth)}
            className="glass-effect border-white/20 hover:border-green-500/50 btn-modern"
          >
            Last Month
          </Button>
          <Button
            variant={
              dateRange &&
              dateRange.from?.toDateString() === predefinedRanges.today.from.toDateString() &&
              dateRange.to?.toDateString() === predefinedRanges.today.to.toDateString()
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => selectPredefinedRange(predefinedRanges.today)}
            className="glass-effect border-white/20 hover:border-yellow-500/50 btn-modern"
          >
            Today
          </Button>
          <Button
            variant={
              dateRange &&
              dateRange.from?.toDateString() === predefinedRanges.yesterday.from.toDateString() &&
              dateRange.to?.toDateString() === predefinedRanges.yesterday.to.toDateString()
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => selectPredefinedRange(predefinedRanges.yesterday)}
            className="glass-effect border-white/20 hover:border-yellow-500/50 btn-modern"
          >
            Yesterday
          </Button>
        </div>

        <div className="mt-4 md:mt-0 flex gap-4">
          <Button
            variant={showTrends ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setShowTrends(!showTrends)}
          >
            <TrendingUp className="h-4 w-4" />
            {showTrends ? "Hide Trends" : "Show Trends"}
          </Button>

          {!showTrends && <ComparisonToggle enabled={comparisonEnabled} onToggle={handleComparisonToggle} />}
        </div>
      </div>

      {dateRange?.from && (
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between">
            <p className="text-sm font-medium">Current period: {getDateRangeDescription(dateRange)}</p>
            {comparisonEnabled && comparisonDateRange?.from && !showTrends && (
              <p className="text-sm font-medium text-muted-foreground">
                Comparison period: {getDateRangeDescription(comparisonDateRange)}
              </p>
            )}
            {showTrends && (
              <p className="text-sm font-medium text-muted-foreground">Showing trend analysis and forecasting</p>
            )}
          </div>
        </div>
      )}

      {comparisonEnabled && !isLoading && !showTrends && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComparisonSummary
            title="Total Orders"
            currentValue={calculateTotal(orderData)}
            previousValue={calculateTotal(comparisonOrderData)}
            percentageChange={orderSummary?.percentageChange || 0}
          />
          <ComparisonSummary
            title="Total Revenue"
            currentValue={calculateTotal(revenueData)}
            previousValue={calculateTotal(comparisonRevenueData)}
            percentageChange={revenueSummary?.percentageChange || 0}
            valueFormatter={formatCurrency}
          />
          <ComparisonSummary
            title="User Activity"
            currentValue={calculateTotal(userActivityData)}
            previousValue={calculateTotal(comparisonUserActivityData)}
            percentageChange={userActivitySummary?.percentageChange || 0}
          />
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
        <TabsList className="grid w-full grid-cols-4 glass-effect border border-white/20 p-1 h-auto rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Overview</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Orders</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Customers</TabsTrigger>
          <TabsTrigger value="menu" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Menu Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6" data-tab="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading || isInitialLoading ? (
              <>
                {showTrends ? (
                  <>
                    <TrendChartSkeleton title="Orders" description="Daily order count with forecast" />
                    <TrendChartSkeleton title="Revenue" description="Daily revenue in USD with forecast" />
                  </>
                ) : comparisonEnabled ? (
                  <>
                    <ComparisonChartSkeleton title="Orders" description="Daily order count" />
                    <ComparisonChartSkeleton title="Revenue" description="Daily revenue in USD" />
                  </>
                ) : (
                  <>
                    <ChartSkeleton type="line" title="Orders" description="Daily order count" />
                    <ChartSkeleton type="bar" title="Revenue" description="Daily revenue in USD" />
                  </>
                )}
                <ChartSkeleton type="pie" title="Popular Items" description="Most ordered items" />
                <ChartSkeleton type="bar" title="Peak Hours" description="Orders by time of day" />
              </>
            ) : showTrends ? (
              <>
                <TrendChart
                  title="Orders"
                  description="Daily order count with forecast"
                  data={orderData}
                  labels={labels}
                  forecastPeriods={7}
                />
                <TrendChart
                  title="Revenue"
                  description="Daily revenue in EGP with forecast"
                  data={revenueData}
                  labels={labels}
                  forecastPeriods={7}
                  valueFormatter={formatCurrency}
                />
                <div className="chart-container">
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
                <div className="chart-container">
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
            ) : comparisonEnabled ? (
              <>
                <ComparisonChart
                  title="Orders"
                  description="Daily order count"
                  currentData={orderData}
                  previousData={comparisonOrderData}
                  labels={labels}
                  type="line"
                />
                <ComparisonChart
                  title="Revenue"
                  description="Daily revenue in EGP"
                  currentData={revenueData}
                  previousData={comparisonRevenueData}
                  labels={labels}
                  type="bar"
                  valueFormatter={formatCurrency}
                />
                <div className="chart-container">
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
                <div className="chart-container">
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
                {showTrends ? (
                  <TrendChartSkeleton title="Order Volume" description="Orders over time with forecast" />
                ) : comparisonEnabled ? (
                  <ComparisonChartSkeleton title="Order Volume" description="Orders over time" />
                ) : (
                  <ChartSkeleton type="line" title="Order Volume" description="Orders over time" />
                )}
                <ChartSkeleton type="bar" title="Average Order Value" description="Average spending per order" />
              </>
            ) : showTrends ? (
              <TrendChart
                title="Order Volume"
                description="Orders over time with forecast"
                data={orderData}
                labels={labels}
                forecastPeriods={14}
              />
            ) : comparisonEnabled ? (
              <ComparisonChart
                title="Order Volume"
                description="Orders over time"
                currentData={orderData}
                previousData={comparisonOrderData}
                labels={labels}
                type="line"
              />
            ) : (
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
            )}
            {!isLoading && !isInitialLoading && (
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
                {showTrends ? (
                  <TrendChartSkeleton title="User Activity" description="Daily active users with forecast" />
                ) : comparisonEnabled ? (
                  <ComparisonChartSkeleton title="User Activity" description="Daily active users" />
                ) : (
                  <ChartSkeleton type="line" title="User Activity" description="Daily active users" />
                )}
                <ChartSkeleton type="doughnut" title="Customer Satisfaction" description="Feedback ratings" />
              </>
            ) : showTrends ? (
              <TrendChart
                title="User Activity"
                description="Daily active users with forecast"
                data={userActivityData}
                labels={labels}
                forecastPeriods={14}
              />
            ) : comparisonEnabled ? (
              <ComparisonChart
                title="User Activity"
                description="Daily active users"
                currentData={userActivityData}
                previousData={comparisonUserActivityData}
                labels={labels}
                type="line"
              />
            ) : (
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
            )}
            {!isLoading && !isInitialLoading && (
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

// Main export with error boundary
export default function AnalyticsPage() {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsPageContent />
    </AnalyticsErrorBoundary>
  )
}
