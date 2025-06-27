"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { OptimizedOrdersService } from "@/lib/optimized-orders-service"
import { RefreshCw, Eye, Clock } from "lucide-react"
import Image from "next/image"
import { PageHeader } from "@/components/admin/page-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface OrderData {
  id: string
  orderId: string
  orderNumber: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    image: string
  }
  cafeteria: {
    id: string
    name: string
    location: string
  }
  items: number
  total: number
  totalFormatted: string
  status: {
    raw: string
    label: string
    color: string
    category: string
  }
  time: string
  createdAt: string
  paymentStatus: string
  paymentMethod: string
  platform: string
  isPickedUp: boolean
  rating?: number
  reviewComment?: string
  cancellationReason?: string
}

interface OrderCounts {
  active: number
  completed: number
  canceled: number
}

export default function OrderInsights() {
  const [activeTab, setActiveTab] = useState("active")
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [orderData, setOrderData] = useState<{
    active: OrderData[]
    completed: OrderData[]
    canceled: OrderData[]
  }>({
    active: [],
    completed: [],
    canceled: []
  })
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    active: 0,
    completed: 0,
    canceled: 0
  })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
  const { toast } = useToast()

  // Handle viewing order details - using the same approach as cafeteria interface
  const handleViewOrder = async (order: OrderData) => {
    setSelectedOrder(order)
    setViewDialogOpen(true)
    setLoadingOrderDetails(true)

    try {
      console.log('🔍 Fetching order details using OptimizedOrdersService for:', order.id)

      // Use the same service that works for cafeteria interface
      const orderDetails = await OptimizedOrdersService.getOrderDetails(order.id)

      if (orderDetails) {
        console.log('📦 Order details received:', orderDetails)
        setSelectedOrderDetails(orderDetails)

        toast({
          title: "Order Details Loaded",
          description: `Successfully loaded details for order ${order.id}`,
        })
      } else {
        throw new Error('Order details not found')
      }
    } catch (error) {
      console.error('💥 Error in handleViewOrder:', error)
      toast({
        title: "Error",
        description: `Failed to load order details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true)

      // Fetch orders from our API endpoint
      console.log('🔄 Fetching orders from API...')
      const response = await fetch('/api/orders?status=all&limit=100')
      const data = await response.json()

      console.log('📡 API Response:', { status: response.status, data })

      if (!response.ok) {
        console.error('❌ API Error:', data)
        throw new Error(data.error || 'Failed to fetch orders')
      }

      // Categorize orders by status
      const activeOrders = data.orders?.filter((order: OrderData) =>
        order.status.category === 'active'
      ) || []

      const completedOrders = data.orders?.filter((order: OrderData) =>
        order.status.category === 'completed'
      ) || []

      const canceledOrders = data.orders?.filter((order: OrderData) =>
        order.status.category === 'cancelled'
      ) || []

      setOrderData({
        active: activeOrders,
        completed: completedOrders,
        canceled: canceledOrders
      })

      // Use counts from API if available, otherwise calculate
      setOrderCounts({
        active: data.counts?.active || activeOrders.length,
        completed: data.counts?.completed || completedOrders.length,
        canceled: data.counts?.cancelled || canceledOrders.length
      })

      toast({
        title: "Orders loaded",
        description: `Loaded ${data.total} orders from database`,
      })

    } catch (error: any) {
      console.error('Error loading orders:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load order data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast({
      title: "Refreshing orders",
      description: "Fetching the latest order data...",
    })

    try {
      await loadOrders()
      toast({
        title: "Orders refreshed",
        description: "Order data has been updated with the latest information.",
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

  useEffect(() => {
    loadOrders()
  }, [])

  // Get the current orders based on active tab
  const currentOrders = orderData[activeTab as keyof typeof orderData] || []

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading order data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Order Insights"
        subtitle="Track and manage all orders across cafeterias"
      />

      <Card className="modern-card glass-effect hover-lift">
        <CardContent className="p-8 relative">
          <div className="mb-8 animate-slide-in-up flex justify-end items-center">
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
          </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-2xl"></div>

            <div className="flex justify-end mb-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="glass-effect border border-white/20 p-1 h-auto rounded-xl">
                  <TabsTrigger
                    value="active"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Active <span className="ml-2 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-xs animate-pulse">{orderCounts.active}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Completed <span className="ml-2 bg-emerald-500 text-white px-1.5 py-0.5 rounded-full text-xs animate-pulse">{orderCounts.completed}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="canceled"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Canceled <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs animate-pulse">{orderCounts.canceled}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Cafeteria</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800">
                      <td className="py-4 px-4">{order.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                            <Image
                              src={order.customer.image || "/placeholder.svg"}
                              alt={order.customer.name}
                              width={32}
                              height={32}
                            />
                          </div>
                          <span>{order.customer.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">{order.cafeteria.name}</td>
                      <td className="py-4 px-4">{order.items}</td>
                      <td className="py-4 px-4">{order.totalFormatted}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 bg-${order.status.color}-500/20 text-${order.status.color}-500 rounded-full text-xs`}
                        >
                          {order.status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">{order.time}</td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          className="hover:bg-blue-500/20"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={(open) => {
          setViewDialogOpen(open)
          if (!open) {
            setSelectedOrderDetails(null)
          }
        }}>
          <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                {selectedOrder && `Order ${selectedOrder.id} placed by ${selectedOrder.customer.name}`}
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
                    <p className="text-lg font-bold text-emerald-600">{selectedOrderDetails.total_amount?.toFixed(2)} EGP</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Customer</p>
                  <div className="space-y-1">
                    <p className="font-medium text-base">{selectedOrderDetails.customer_details?.full_name || selectedOrder?.customer.name}</p>
                    {selectedOrderDetails.customer_details?.email && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedOrderDetails.customer_details.email}</p>
                    )}
                    {selectedOrderDetails.customer_details?.phone && (
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
                                @ {item.price?.toFixed(2)} EGP each
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
                              <span className="font-bold text-lg text-emerald-600">{item.total?.toFixed(2)} EGP</span>
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
              <div className="text-center py-8 text-slate-500">
                Failed to load order details
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
    </div>
  )
}
