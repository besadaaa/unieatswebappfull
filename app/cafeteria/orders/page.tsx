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
import { Search, Eye, Clock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getOrders, updateOrderStatus as updateOrderStatusAPI } from "@/app/actions/orders"
import { getCurrentUser, getCafeterias } from "@/lib/supabase"
import { useEffect } from "react"

// Mock data for different order statuses
const newOrders = [
  {
    id: "ORD-001",
    customer: "Alex Johnson",
    items: ["Veggie Wrap", "Iced Tea"],
    total: "$12.99",
    time: "2023-05-15T09:15:00",
    status: "new",
  },
  {
    id: "ORD-002",
    customer: "Sarah Williams",
    items: ["Chicken Salad", "Sparkling Water"],
    total: "$15.50",
    time: "2023-05-15T09:22:00",
    status: "new",
  },
]

const preparingOrders = [
  {
    id: "ORD-003",
    customer: "Michael Brown",
    items: ["Breakfast Burrito", "Coffee"],
    total: "$10.99",
    time: "2023-05-15T08:45:00",
    status: "preparing",
  },
]

const readyOrders = [
  {
    id: "ORD-004",
    customer: "Emily Davis",
    items: ["Caesar Salad", "Lemonade"],
    total: "$13.50",
    time: "2023-05-15T08:30:00",
    status: "ready",
  },
]

const completedOrders = [
  {
    id: "ORD-005",
    customer: "David Wilson",
    items: ["Turkey Sandwich", "Chips", "Soda"],
    total: "$16.99",
    time: "2023-05-15T08:00:00",
    status: "completed",
  },
  {
    id: "ORD-006",
    customer: "Jessica Martinez",
    items: ["Fruit Bowl", "Green Tea"],
    total: "$9.50",
    time: "2023-05-15T07:45:00",
    status: "completed",
  },
]

const cancelledOrders = [
  {
    id: "ORD-007",
    customer: "Robert Taylor",
    items: ["Veggie Burger", "Fries", "Milkshake"],
    total: "$18.99",
    time: "2023-05-15T09:05:00",
    status: "cancelled",
    reason: "Customer requested cancellation",
  },
]

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
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("new")
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<'created_at' | 'pickup_time' | 'total_amount' | 'status'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // State to track orders
  const [orders, setOrders] = useState({
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

  // Load orders from Supabase
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        console.log('Loading orders from Supabase...')

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

        // Get orders filtered by cafeteria ID
        const allOrders = await getOrders(undefined, userCafeteria.id)
        console.log('Fetched orders for cafeteria:', userCafeteria.name, 'Count:', allOrders.length)

        // Transform and group orders by status
        const transformedOrders = allOrders.map(transformOrder)

        const groupedOrders = {
          new: transformedOrders.filter(order => order.status === 'new'),
          preparing: transformedOrders.filter(order => order.status === 'preparing'),
          ready: transformedOrders.filter(order => order.status === 'ready'),
          completed: transformedOrders.filter(order => order.status === 'completed'),
          cancelled: transformedOrders.filter(order => order.status === 'cancelled'),
        }

        console.log('Grouped orders:', {
          new: groupedOrders.new.length,
          preparing: groupedOrders.preparing.length,
          ready: groupedOrders.ready.length,
          completed: groupedOrders.completed.length,
          cancelled: groupedOrders.cancelled.length,
        })

        setOrders(groupedOrders)
      } catch (error) {
        console.error('Error loading orders:', error)
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadOrders()

    // Set up real-time updates - refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update the updateOrderStatus function to properly handle order status changes

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Show loading state
      toast({
        title: "Updating order status...",
        description: `Changing order ${orderId} status to ${newStatus}...`,
      })

      // Update order status in Supabase
      const result = await updateOrderStatusAPI(orderId, newStatus)

      if (result.success) {
        // Get current user and their cafeteria for reload
        const user = await getCurrentUser()
        const cafeterias = await getCafeterias()
        const userCafeteria = cafeterias.find(c => c.owner_id === user?.id) || cafeterias[0]

        if (userCafeteria) {
          // Reload orders filtered by cafeteria ID
          const allOrders = await getOrders(undefined, userCafeteria.id)

          // Transform and group orders by status
          const transformedOrders = allOrders.map(transformOrder)

          const groupedOrders = {
            new: transformedOrders.filter(order => order.status === 'new'),
            preparing: transformedOrders.filter(order => order.status === 'preparing'),
            ready: transformedOrders.filter(order => order.status === 'ready'),
            completed: transformedOrders.filter(order => order.status === 'completed'),
            cancelled: transformedOrders.filter(order => order.status === 'cancelled'),
          }

          setOrders(groupedOrders)
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

  // Sort orders based on selected field and direction
  const sortOrders = (ordersList: any[]) => {
    return [...ordersList].sort((a, b) => {
      let aValue, bValue

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.time).getTime()
          bValue = new Date(b.time).getTime()
          break
        case 'pickup_time':
          aValue = a.pickup_time ? new Date(a.pickup_time).getTime() : 0
          bValue = b.pickup_time ? new Date(b.pickup_time).getTime() : 0
          break
        case 'total_amount':
          aValue = parseFloat(a.total.replace(' EGP', ''))
          bValue = parseFloat(b.total.replace(' EGP', ''))
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
  const filterOrders = (ordersList: any[]) => {
    if (!searchQuery) return ordersList

    return ordersList.filter(
      (order) =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item: string) => item.toLowerCase().includes(searchQuery.toLowerCase())),
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
  const renderOrderTable = (ordersList: any[]) => {
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
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items.join(", ")}</TableCell>
                  <TableCell>{order.total}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-gray-400" />
                      <span>{timeSince(order.time)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-600">
                        {order.pickup_time_formatted}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedOrder(order)
                          setViewDialogOpen(true)
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
                        <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order.id, "cancelled")}>
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
        <div className="flex justify-between items-center animate-slide-in-up">
          <h1 className="text-3xl font-bold gradient-text animate-shimmer">Order Management</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 glass-effect px-3 py-2 rounded-lg border border-white/20">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort by: {sortField.replace('_', ' ')} ({sortDirection})</span>
            </div>
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
              <Badge className="ml-2 bg-blue-500 text-white animate-pulse">{orders.new.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="preparing" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Preparing
              <Badge className="ml-2 bg-amber-500 text-white animate-pulse">{orders.preparing.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ready" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Ready
              <Badge className="ml-2 bg-emerald-500 text-white animate-pulse">{orders.ready.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Completed
              <Badge className="ml-2 bg-slate-500 text-white animate-pulse">{orders.completed.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">
              Cancelled
              <Badge className="ml-2 bg-red-500 text-white animate-pulse">{orders.cancelled.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            {renderOrderTable(orders.new)}
          </TabsContent>

          <TabsContent value="preparing" className="mt-4">
            {renderOrderTable(orders.preparing)}
          </TabsContent>

          <TabsContent value="ready" className="mt-4">
            {renderOrderTable(orders.ready)}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {renderOrderTable(orders.completed)}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            {renderOrderTable(orders.cancelled)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order ${selectedOrder.id} placed by ${selectedOrder.customer}`}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
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
                  <p className="text-sm font-medium text-gray-500">Time Placed</p>
                  <p className="mt-1">{formatDate(selectedOrder.time)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pickup Time</p>
                  <div className="flex items-center mt-1">
                    <Clock className="mr-1 h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600">
                      {selectedOrder.pickup_time_formatted || 'ASAP'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="mt-1 font-medium">{selectedOrder.total}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Items</p>
                <ul className="mt-1 space-y-1">
                  {selectedOrder.items.map((item: string, index: number) => (
                    <li key={index} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedOrder.status === "cancelled" && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Cancellation Reason</p>
                  <p className="mt-1 text-sm">{selectedOrder.reason || "No reason provided"}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>

            {selectedOrder && selectedOrder.status === "new" && (
              <Button
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, "preparing")
                  setViewDialogOpen(false)
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
                }}
              >
                Complete Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
