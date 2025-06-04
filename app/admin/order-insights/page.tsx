"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"
import Image from "next/image"
import { PageHeader } from "@/components/admin/page-header"

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
  const { toast } = useToast()

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true)

      // Fetch orders from our API endpoint
      const response = await fetch('/api/orders?status=all&limit=100')
      const data = await response.json()

      if (!response.ok) {
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
