"use client"

import type React from "react"

import { useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Clock, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getOrders, updateOrderStatus as updateOrderStatusAPI } from "@/app/actions/orders"
import { getCurrentUser, getCafeterias } from "@/lib/supabase"
import { useEffect } from "react"
import { OptimizedOrdersService, OptimizedOrder } from "@/lib/optimized-orders-service"
import { CafeteriaPageHeader } from "@/components/cafeteria/page-header"
import { CafeteriaCancellationDialog } from "@/components/cafeteria-order-cancellation-dialog"

// Orders are fetched from Supabase using OptimizedOrdersService

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// Helper function to calculate time since order
function timeSince(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + "h ago"
  }

  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + "m ago"
  }

  return Math.floor(seconds) + "s ago"
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
  const [activeTab, setActiveTab] = useState("new")
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortField, setSortField] = useState<'created_at' | 'pickup_time' | 'total_amount' | 'status'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [cafeteriaId, setCafeteriaId] = useState<string>("")
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<any>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [orderCounts, setOrderCounts] = useState({
    new: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  })

  // State to track orders (optimized)
  const [orders, setOrders] = useState<{
    new: OptimizedOrder[]
    preparing: OptimizedOrder[]
    ready: OptimizedOrder[]
    completed: OptimizedOrder[]
    cancelled: OptimizedOrder[]
  }>({
    new: [],
    preparing: [],
    ready: [],
    completed: [],
    cancelled: [],
  })

  // Transform Supabase order data to match UI expectations
  const transformOrder = (order: any) => {
    const customer = order.student?.full_name || order.user?.full_name || 'Unknown Customer'
    const items = order.order_items?.map((item: any) =>
      `${item.quantity}x ${item.menu_items?.name || 'Unknown Item'}`
    ) || []

    // Calculate total from order items if total_amount is 0
    let calculatedTotal = order.total_amount || 0
    if (calculatedTotal === 0 && order.order_items?.length > 0) {
      calculatedTotal = order.order_items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * (item.price || 0))
      }, 0)
    }

    const total = `${calculatedTotal.toFixed(2)} EGP`
    const time = order.created_at

    // Format pickup time
    const formatPickupTime = (pickupTime: string | null) => {
      if (!pickupTime) return 'ASAP'
      try {
        const date = new Date(pickupTime)
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      } catch {
        return 'ASAP'
      }
    }

    return {
      id: order.id,
      customer,
      items,
      total,
      time,
      pickup_time: order.pickup_time,
      pickup_time_formatted: formatPickupTime(order.pickup_time),
      status: order.status === 'pending' ? 'new' : order.status,
      reason: order.cancellation_reason,
      originalOrder: order // Keep reference to original order for updates
    }
  }

  // Optimized order loading
  useEffect(() => {
    let subscription: any = null

    const initializeOrders = async () => {
      try {
        setLoading(true)
        console.log('Initializing optimized orders...')

        // Get current user and their cafeteria
        const user = await getCurrentUser()
        if (!user) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view orders.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const cafeterias = await getCafeterias()
        const userCafeteria = cafeterias.find(c => c.owner_id === user.id) || cafeterias[0]

        if (!userCafeteria) {
          toast({
            title: "No Cafeteria Found",
            description: "No cafeteria available for order management.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        setCafeteriaId(userCafeteria.id)
        await loadOrdersOptimized(userCafeteria.id)

        // Set up real-time subscription
        subscription = OptimizedOrdersService.subscribeToOrderUpdates(
          userCafeteria.id,
          () => {
            console.log('Real-time update received, reloading orders...')
            loadOrdersOptimized(userCafeteria.id)
          }
        )

      } catch (error) {
        console.error('Error initializing orders:', error)
        toast({
          title: "Error",
          description: "Failed to initialize orders. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    initializeOrders()

    // Cleanup function
    return () => {
      if (subscription) {
        console.log('Cleaning up order subscription...')
        subscription.unsubscribe()
      }
    }
  }, [])

  // Load orders using optimized service
  const loadOrdersOptimized = async (cafeteriaId: string) => {
    try {
      console.log('Loading orders with optimized service...')
      const startTime = Date.now()

      // Load orders for each status in parallel
      const [newOrders, preparingOrders, readyOrders, completedOrders, cancelledOrders, counts] = await Promise.all([
        OptimizedOrdersService.getOrdersList(cafeteriaId, 'new', 20),
        OptimizedOrdersService.getOrdersList(cafeteriaId, 'preparing', 20),
        OptimizedOrdersService.getOrdersList(cafeteriaId, 'ready', 20),
        OptimizedOrdersService.getOrdersList(cafeteriaId, 'completed', 50),
        OptimizedOrdersService.getOrdersList(cafeteriaId, 'cancelled', 20),
        OptimizedOrdersService.getOrdersCounts(cafeteriaId)
      ])

      const loadTime = Date.now() - startTime
      console.log(`Orders loaded in ${loadTime}ms`)

      setOrders({
        new: newOrders?.orders || [],
        preparing: preparingOrders?.orders || [],
        ready: readyOrders?.orders || [],
        completed: completedOrders?.orders || [],
        cancelled: cancelledOrders?.orders || [],
      })

      setOrderCounts(counts)
      setLoading(false)

    } catch (error) {
      console.error('Error loading optimized orders:', error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Update the updateOrderStatus function to properly handle order status changes

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Show loading state
      toast({
        title: "Updating order status...",
        description: `Changing order ${orderId} status to ${newStatus}...`,
      })

      // Update order status using optimized service
      const result = await OptimizedOrdersService.updateOrderStatus(orderId, newStatus)

      if (result.success) {
        // Reload orders quickly
        if (cafeteriaId) {
          await loadOrdersOptimized(cafeteriaId)
        }

        toast({
          title: "Order Status Updated",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle order cancellation with reason
  const handleCancelOrder = (order: any) => {
    setOrderToCancel(order)
    setCancellationDialogOpen(true)
  }

  const confirmCancelOrder = async (reason: string) => {
    if (!orderToCancel) return

    setIsCancelling(true)
    try {
      // Update order status to cancelled with reason using API endpoint
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderToCancel.id,
          cafeteriaId: cafeteriaId,
          reason: reason,
          cancelledBy: 'cafeteria'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to cancel order')
      }

      // Reload orders
      if (cafeteriaId) {
        await loadOrdersOptimized(cafeteriaId)
      }

      toast({
        title: "Order cancelled",
        description: `Order #${orderToCancel.order_number} has been cancelled successfully.`,
      })

      // Close dialog
      setCancellationDialogOpen(false)
      setOrderToCancel(null)
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast({
      title: "Refreshing orders",
      description: "Clearing cache and fetching the latest order data...",
    })

    try {
      // Clear all caches to force fresh data
      OptimizedOrdersService.clearAllCaches()

      if (cafeteriaId) {
        await loadOrdersOptimized(cafeteriaId)
        toast({
          title: "Orders refreshed",
          description: "Order data has been updated with the latest information.",
        })
      }
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

  // Fetch full order details for the dialog
  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoadingOrderDetails(true)
      const details = await OptimizedOrdersService.getOrderDetails(orderId)
      setSelectedOrderDetails(details)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive",
      })
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  // Sort orders based on selected field and direction
  const sortOrders = (ordersList: OptimizedOrder[]) => {
    if (!ordersList || !Array.isArray(ordersList)) {
      return []
    }
    return [...ordersList].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'pickup_time':
          aValue = a.pickup_time ? new Date(a.pickup_time).getTime() : 0
          bValue = b.pickup_time ? new Date(b.pickup_time).getTime() : 0
          break
        case 'total_amount':
          aValue = parseFloat(a.total_amount.toString())
          bValue = parseFloat(b.total_amount.toString())
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  // Filter orders based on search query
  const filterOrders = (ordersList: OptimizedOrder[]) => {
    if (!ordersList || !Array.isArray(ordersList)) {
      return []
    }
    if (!searchQuery) return ordersList

    return ordersList.filter(
      (order) =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items_summary.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  // Handle sort field change
  const handleSort = (field: 'created_at' | 'pickup_time' | 'total_amount' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Search Results",
      description: `Showing results for: ${searchQuery}`,
    })
  }

  // Render order table for a specific status
  const renderOrderTable = (ordersList: OptimizedOrder[]) => {
    // Add safety check for ordersList
    if (!ordersList || !Array.isArray(ordersList)) {
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Order Time</TableHead>
                <TableHead>Pickup Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Loading orders...
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }

    const filteredOrders = filterOrders(ordersList)
    const sortedOrders = sortOrders(filteredOrders)

    const getSortIcon = (field: string) => {
      if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
      return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('total_amount')}
              >
                <div className="flex items-center gap-1">
                  Total
                  {getSortIcon('total_amount')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Order Time
                  {getSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('pickup_time')}
              >
                <div className="flex items-center gap-1">
                  Pickup Time
                  {getSortIcon('pickup_time')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.items_summary}</TableCell>
                  <TableCell>{order.total_amount.toFixed(2)} EGP</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-gray-400" />
                      <span>{timeSince(order.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-600">
                        {order.pickup_time ? formatDate(order.pickup_time) : 'ASAP'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          setSelectedOrder(order)
                          setViewDialogOpen(true)
                          await fetchOrderDetails(order.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === "new" && (
                        <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order.id, "preparing")}>
                          Start
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order.id, "ready")}>
                          Ready
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>
                          Complete
                        </Button>
                      )}
                      {(order.status === "new" || order.status === "preparing") && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancelOrder(order)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-8 animate-fade-in">
      <div className="space-y-8">
        <CafeteriaPageHeader
          title="Order Management"
          subtitle="Manage and track all incoming orders"
        />

        <div className="flex justify-end items-center animate-slide-in-up">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 glass-effect px-3 py-2 rounded-lg border border-white/20">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort by: {sortField.replace('_', ' ')} ({sortDirection})</span>
            </div>
            <Button
              variant="outline"
              className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern transition-all duration-300"
              onClick={handleRefresh}
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
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search orders..."
                className="pl-10 glass-effect border-white/20 hover:border-blue-500/50 focus:border-blue-500/50 btn-modern transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>

        <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <TabsList className="grid w-full grid-cols-5 glass-effect border border-white/20 p-1 h-auto rounded-xl">
            <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              New
              <Badge className="ml-2 bg-blue-500 text-white animate-pulse">{orders.new?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="preparing" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Preparing
              <Badge className="ml-2 bg-amber-500 text-white animate-pulse">{orders.preparing?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ready" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Ready
              <Badge className="ml-2 bg-emerald-500 text-white animate-pulse">{orders.ready?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Completed
              <Badge className="ml-2 bg-slate-500 text-white animate-pulse">{orders.completed?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Cancelled
              <Badge className="ml-2 bg-red-500 text-white animate-pulse">{orders.cancelled?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            {renderOrderTable(orders.new || [])}
          </TabsContent>

          <TabsContent value="preparing" className="mt-4">
            {renderOrderTable(orders.preparing || [])}
          </TabsContent>

          <TabsContent value="ready" className="mt-4">
            {renderOrderTable(orders.ready || [])}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {renderOrderTable(orders.completed || [])}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            {renderOrderTable(orders.cancelled || [])}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open)
        if (!open) {
          setSelectedOrderDetails(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <DialogHeader>
            <DialogTitle className="gradient-text">Order Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedOrder && `Order ${selectedOrder.id} placed by ${selectedOrder.customer_name}`}
            </DialogDescription>
          </DialogHeader>

          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading order details...</span>
            </div>
          ) : selectedOrderDetails ? (
            <div className="space-y-6 p-2">
              {/* Order Status and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Status</p>
                  <Badge
                    className={`${
                      selectedOrderDetails.status === "new"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : selectedOrderDetails.status === "preparing"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : selectedOrderDetails.status === "ready"
                            ? "bg-green-500 hover:bg-green-600"
                            : selectedOrderDetails.status === "completed"
                              ? "bg-gray-500 hover:bg-gray-600"
                              : "bg-red-500 hover:bg-red-600"
                    } text-white font-medium px-3 py-1`}
                  >
                    {selectedOrderDetails.status.charAt(0).toUpperCase() + selectedOrderDetails.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Time Placed</p>
                  <p className="text-sm font-medium">{formatDate(selectedOrderDetails.created_at)}</p>
                </div>
              </div>

              {/* Pickup Time and Total */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Pickup Time</p>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600">
                      {selectedOrderDetails.pickup_time ? formatDate(selectedOrderDetails.pickup_time) : 'ASAP'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total</p>
                  <p className="text-lg font-bold text-emerald-600">{selectedOrderDetails.total_amount.toFixed(2)} EGP</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Customer</p>
                <div className="space-y-1">
                  <p className="font-medium text-base">{selectedOrderDetails.customer_details.full_name}</p>
                  {selectedOrderDetails.customer_details.email && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedOrderDetails.customer_details.email}</p>
                  )}
                  {selectedOrderDetails.customer_details.phone && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedOrderDetails.customer_details.phone}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Order Items</p>
                <div className="space-y-3">
                  {selectedOrderDetails.order_items && selectedOrderDetails.order_items.length > 0 ? (
                    selectedOrderDetails.order_items.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{item.quantity}x {item.menu_item_name}</span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              @ {item.price.toFixed(2)} EGP each
                            </div>
                            {item.notes && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                                <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <div>
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Special Instructions:</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{item.notes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <span className="font-bold text-lg text-emerald-600">{item.total.toFixed(2)} EGP</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500">No items available</div>
                  )}
                </div>
              </div>

              {/* Cancellation Information */}
              {selectedOrderDetails.status === "cancelled" && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3">Cancellation Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Cancelled By</p>
                      <p className="text-sm font-semibold capitalize text-red-800 dark:text-red-300">
                        {selectedOrderDetails.cancelled_by || "Unknown"}
                      </p>
                    </div>
                    {selectedOrderDetails.cancelled_at && (
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Cancelled At</p>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                          {new Date(selectedOrderDetails.cancelled_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Cancellation Reason</p>
                    <p className="text-sm text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-2 rounded border">
                      {selectedOrderDetails.cancellation_reason || "No reason provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <Badge
                    className={`mt-1 ${
                      selectedOrder.status === "new"
                        ? "bg-blue-500"
                        : selectedOrder.status === "preparing"
                          ? "bg-yellow-500"
                          : selectedOrder.status === "ready"
                            ? "bg-green-500"
                            : selectedOrder.status === "completed"
                              ? "bg-gray-500"
                              : "bg-red-500"
                    }`}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Placed</p>
                  <p className="mt-1">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pickup Time</p>
                  <div className="flex items-center mt-1">
                    <Clock className="mr-1 h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600">
                      {selectedOrder.pickup_time ? formatDate(selectedOrder.pickup_time) : 'ASAP'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                  <p className="mt-1 font-medium">{selectedOrder.total_amount.toFixed(2)} EGP</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Items Summary</p>
                <p className="mt-1 text-sm">{selectedOrder.items_summary}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setViewDialogOpen(false)
              setSelectedOrderDetails(null)
            }}>
              Close
            </Button>

            {selectedOrder && selectedOrder.status === "new" && (
              <Button
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, "preparing")
                  setViewDialogOpen(false)
                  setSelectedOrderDetails(null)
                }}
              >
                Start Preparing
              </Button>
            )}

            {selectedOrder && selectedOrder.status === "preparing" && (
              <Button
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, "ready")
                  setViewDialogOpen(false)
                  setSelectedOrderDetails(null)
                }}
              >
                Mark as Ready
              </Button>
            )}

            {selectedOrder && selectedOrder.status === "ready" && (
              <Button
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, "completed")
                  setViewDialogOpen(false)
                  setSelectedOrderDetails(null)
                }}
              >
                Complete Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <CafeteriaCancellationDialog
        isOpen={cancellationDialogOpen}
        onClose={() => {
          setCancellationDialogOpen(false)
          setOrderToCancel(null)
        }}
        onConfirm={confirmCancelOrder}
        orderNumber={orderToCancel?.order_number || ''}
        isLoading={isCancelling}
      />
    </div>
  )
}
