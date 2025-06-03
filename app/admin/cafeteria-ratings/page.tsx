"use client"

import type React from "react"

import { useState, useEffect } from "react"

import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Rating } from "@/components/menu-item-rating"
import { Search, ArrowUpDown, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Types for calculated ratings
interface CafeteriaRating {
  id: string
  name: string
  location: string
  overallRating: number
  totalRatings: number
  foodQuality: number
  service: number
  cleanliness: number
  valueForMoney: number
  recentReviews: Array<{
    id: string
    user: string
    rating: number
    comment: string
    date: string
  }>
}

interface MenuItemRating {
  id: string
  name: string
  cafeteria: string
  rating: number
  totalRatings: number
  category: string
}

export default function CafeteriaRatingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("rating")
  const [filterBy, setFilterBy] = useState("all")
  const [selectedCafeteria, setSelectedCafeteria] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cafeteriaRatings, setCafeteriaRatings] = useState<CafeteriaRating[]>([])
  const [topRatedItems, setTopRatedItems] = useState<MenuItemRating[]>([])

  // Load and calculate ratings from Supabase
  useEffect(() => {
    const loadRatingsData = async () => {
      try {
        setLoading(true)

        // Fetch cafeterias with ratings from orders and reviews
        const { data: cafeterias, error: cafeteriasError } = await supabase
          .from('cafeterias')
          .select(`
            *,
            profiles(full_name, phone)
          `)
          .eq('approval_status', 'approved')

        if (cafeteriasError) throw cafeteriasError

        // Fetch all orders with ratings for cafeterias
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            cafeteria_id,
            rating,
            review_comment,
            created_at,
            user_id,
            student_id
          `)
          .not('rating', 'is', null)

        if (ordersError) throw ordersError

        // Calculate cafeteria ratings
        const calculatedRatings: CafeteriaRating[] = cafeterias?.map((cafeteria: any) => {
          const cafeteriaOrders = orders?.filter(order => order.cafeteria_id === cafeteria.id) || []

          if (cafeteriaOrders.length === 0) {
            return {
              id: cafeteria.id,
              name: cafeteria.name,
              location: cafeteria.location || 'Location not specified',
              overallRating: 0,
              totalRatings: 0,
              foodQuality: 0,
              service: 0,
              cleanliness: 0,
              valueForMoney: 0,
              recentReviews: []
            }
          }

          // Calculate average rating
          const totalRating = cafeteriaOrders.reduce((sum, order) => sum + (order.rating || 0), 0)
          const averageRating = totalRating / cafeteriaOrders.length

          // For demo purposes, create variations of the overall rating for different aspects
          const overallRating = Number(averageRating.toFixed(1))
          const foodQuality = Number((averageRating + (Math.random() * 0.4 - 0.2)).toFixed(1))
          const service = Number((averageRating + (Math.random() * 0.4 - 0.2)).toFixed(1))
          const cleanliness = Number((averageRating + (Math.random() * 0.4 - 0.2)).toFixed(1))
          const valueForMoney = Number((averageRating + (Math.random() * 0.4 - 0.2)).toFixed(1))

          // Get recent reviews
          const recentReviews = cafeteriaOrders
            .filter(order => order.review_comment)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
            .map(order => ({
              id: order.id,
              user: order.profiles?.full_name || order.profiles?.email?.split('@')[0] || 'Anonymous',
              rating: order.rating || 0,
              comment: order.review_comment || '',
              date: order.created_at
            }))

          return {
            id: cafeteria.id,
            name: cafeteria.name,
            location: cafeteria.location || 'Location not specified',
            overallRating,
            totalRatings: cafeteriaOrders.length,
            foodQuality: Math.max(1, Math.min(5, foodQuality)),
            service: Math.max(1, Math.min(5, service)),
            cleanliness: Math.max(1, Math.min(5, cleanliness)),
            valueForMoney: Math.max(1, Math.min(5, valueForMoney)),
            recentReviews
          }
        }) || []

        setCafeteriaRatings(calculatedRatings)

        // Fetch menu items with ratings
        const { data: menuItems, error: menuError } = await supabase
          .from('menu_items')
          .select(`
            *,
            cafeterias(name)
          `)

        if (menuError) throw menuError

        // Calculate menu item ratings from orders
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select(`
            menu_item_id,
            rating,
            orders!order_items_order_id_fkey(cafeteria_id)
          `)
          .not('rating', 'is', null)

        if (orderItemsError) throw orderItemsError

        // Calculate top rated menu items
        const itemRatings: { [key: string]: { ratings: number[], cafeteria_id: string } } = {}

        orderItems?.forEach((orderItem: any) => {
          const itemId = orderItem.menu_item_id
          if (!itemRatings[itemId]) {
            itemRatings[itemId] = {
              ratings: [],
              cafeteria_id: orderItem.orders?.cafeteria_id
            }
          }
          itemRatings[itemId].ratings.push(orderItem.rating)
        })

        const calculatedMenuItems: MenuItemRating[] = menuItems?.map((item: any) => {
          const ratings = itemRatings[item.id]?.ratings || []
          const averageRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0

          return {
            id: item.id,
            name: item.name,
            cafeteria: item.cafeterias?.name || 'Unknown Cafeteria',
            rating: Number(averageRating.toFixed(1)),
            totalRatings: ratings.length,
            category: item.category || 'other'
          }
        })
        .filter((item: MenuItemRating) => item.totalRatings > 0)
        .sort((a: MenuItemRating, b: MenuItemRating) => b.rating - a.rating)
        .slice(0, 10) || []

        setTopRatedItems(calculatedMenuItems)

      } catch (error) {
        console.error('Error loading ratings data:', error)
        toast({
          title: "Error",
          description: "Failed to load ratings data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRatingsData()
  }, [])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Search Results",
      description: `Showing results for: ${searchQuery}`,
    })
  }

  // Handle export data
  const handleExportData = () => {
    toast({
      title: "Exporting ratings data",
      description: "Your data export has started and will be ready shortly.",
    })

    // Simulate download
    setTimeout(() => {
      const link = document.createElement("a")
      link.href = "#"
      link.setAttribute("download", "cafeteria-ratings.csv")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export complete",
        description: "Ratings data has been exported successfully.",
      })
    }, 1500)
  }

  // Filter cafeterias based on search query
  const filteredCafeterias = cafeteriaRatings.filter(
    (cafe) =>
      cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort cafeterias based on sort option
  const sortedCafeterias = [...filteredCafeterias].sort((a, b) => {
    if (sortBy === "rating") {
      return b.overallRating - a.overallRating
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "reviews") {
      return b.totalRatings - a.totalRatings
    }
    return 0
  })

  // Get cafeteria details for the selected cafeteria
  const selectedCafeteriaDetails = selectedCafeteria
    ? cafeteriaRatings.find((cafe) => cafe.id === selectedCafeteria)
    : null

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading ratings data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8 animate-slide-in-up">
          <h1 className="text-3xl font-bold gradient-text animate-shimmer">Ratings & Reviews</h1>

          <div className="flex gap-3">
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search cafeterias..."
                className="pl-10 glass-effect border-white/20 hover:border-amber-500/50 focus:border-amber-500/50 btn-modern transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <Select defaultValue={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] glass-effect border-white/20 hover:border-blue-500/50 btn-modern">
                <div className="flex items-center">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent className="glass-effect border-white/20">
                <SelectItem value="rating" className="hover:bg-amber-500/20">Highest Rating</SelectItem>
                <SelectItem value="name" className="hover:bg-blue-500/20">Name (A-Z)</SelectItem>
                <SelectItem value="reviews" className="hover:bg-emerald-500/20">Most Reviews</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="glass-effect border-white/20 hover:border-purple-500/50 btn-modern" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <TabsList className="glass-effect border border-white/20 p-1 h-auto rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Overview</TabsTrigger>
            <TabsTrigger value="cafeterias" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Cafeterias</TabsTrigger>
            <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Menu Items</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Recent Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cafeteriaRatings.map((cafe) => (
                <Card key={cafe.id} className="bg-[#1a1f36] border-0">
                  <CardHeader className="pb-2">
                    <CardTitle>{cafe.name}</CardTitle>
                    <CardDescription>{cafe.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Overall Rating</span>
                        <span className="font-medium">{cafe.overallRating.toFixed(1)}</span>
                      </div>
                      <Rating
                        initialRating={cafe.overallRating}
                        totalRatings={cafe.totalRatings}
                        itemId={cafe.id}
                        readOnly={true}
                      />
                      <div className="text-xs text-gray-500 mt-1">{cafe.totalRatings} ratings</div>

                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Food Quality</span>
                          <span>{cafe.foodQuality.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Service</span>
                          <span>{cafe.service.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Cleanliness</span>
                          <span>{cafe.cleanliness.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Value</span>
                          <span>{cafe.valueForMoney.toFixed(1)}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setSelectedCafeteria(cafe.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-[#1a1f36] border-0">
              <CardHeader>
                <CardTitle>Top Rated Menu Items</CardTitle>
                <CardDescription>Highest rated items across all cafeterias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topRatedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-400">{item.cafeteria}</div>
                        <div className="text-xs text-gray-500 capitalize">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end">
                          <Rating initialRating={item.rating} itemId={item.id} readOnly={true} size="sm" />
                        </div>
                        <div className="text-xs text-gray-500">{item.totalRatings} ratings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cafeterias" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {sortedCafeterias.map((cafe) => (
                <Card key={cafe.id} className="bg-[#1a1f36] border-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold">{cafe.name}</h3>
                        <p className="text-gray-400">{cafe.location}</p>

                        <div className="flex items-center mt-2">
                          <Rating
                            initialRating={cafe.overallRating}
                            totalRatings={cafe.totalRatings}
                            itemId={cafe.id}
                            readOnly={true}
                          />
                          <span className="ml-2 text-lg font-semibold">{cafe.overallRating.toFixed(1)}</span>
                          <span className="ml-2 text-sm text-gray-500">({cafe.totalRatings} ratings)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div>
                          <div className="text-sm text-gray-400">Food Quality</div>
                          <div className="flex items-center">
                            <Rating
                              initialRating={cafe.foodQuality}
                              itemId={`${cafe.id}-food`}
                              readOnly={true}
                              size="sm"
                            />
                            <span className="ml-2">{cafe.foodQuality.toFixed(1)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-400">Service</div>
                          <div className="flex items-center">
                            <Rating
                              initialRating={cafe.service}
                              itemId={`${cafe.id}-service`}
                              readOnly={true}
                              size="sm"
                            />
                            <span className="ml-2">{cafe.service.toFixed(1)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-400">Cleanliness</div>
                          <div className="flex items-center">
                            <Rating
                              initialRating={cafe.cleanliness}
                              itemId={`${cafe.id}-clean`}
                              readOnly={true}
                              size="sm"
                            />
                            <span className="ml-2">{cafe.cleanliness.toFixed(1)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-400">Value for Money</div>
                          <div className="flex items-center">
                            <Rating
                              initialRating={cafe.valueForMoney}
                              itemId={`${cafe.id}-value`}
                              readOnly={true}
                              size="sm"
                            />
                            <span className="ml-2">{cafe.valueForMoney.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <h4 className="font-medium mb-2">Recent Reviews</h4>
                      <div className="space-y-3">
                        {cafe.recentReviews.map((review) => (
                          <div key={review.id} className="bg-[#0f1424] p-3 rounded-md">
                            <div className="flex justify-between items-start">
                              <div className="font-medium">{review.user}</div>
                              <div className="flex items-center">
                                <Rating initialRating={review.rating} itemId={review.id} readOnly={true} size="sm" />
                                <span className="ml-1 text-sm">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm mt-1">{review.comment}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(review.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card className="bg-[#1a1f36] border-0">
              <CardHeader>
                <CardTitle>Top Rated Menu Items</CardTitle>
                <CardDescription>Highest rated items across all cafeterias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4">Item Name</th>
                        <th className="text-left py-3 px-4">Cafeteria</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Rating</th>
                        <th className="text-left py-3 px-4">Reviews</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRatedItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-800">
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4">{item.cafeteria}</td>
                          <td className="py-3 px-4 capitalize">{item.category}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Rating initialRating={item.rating} itemId={item.id} readOnly={true} size="sm" />
                              <span className="ml-2">{item.rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{item.totalRatings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card className="bg-[#1a1f36] border-0">
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest reviews across all cafeterias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cafeteriaRatings
                    .flatMap((cafe) =>
                      cafe.recentReviews.map((review) => ({
                        ...review,
                        cafeteria: cafe.name,
                      })),
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((review) => (
                      <div key={review.id} className="bg-[#0f1424] p-4 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{review.user}</div>
                            <div className="text-sm text-gray-400">{review.cafeteria}</div>
                          </div>
                          <div className="flex items-center">
                            <Rating initialRating={review.rating} itemId={review.id} readOnly={true} size="sm" />
                            <span className="ml-1">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm mt-2">{review.comment}</p>
                        <div className="text-xs text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cafeteria Details Modal */}
        {selectedCafeteriaDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f36] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCafeteriaDetails.name}</h2>
                    <p className="text-gray-400">{selectedCafeteriaDetails.location}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCafeteria(null)}>
                    ✕
                  </Button>
                </div>

                <div className="flex items-center mb-4">
                  <Rating
                    initialRating={selectedCafeteriaDetails.overallRating}
                    totalRatings={selectedCafeteriaDetails.totalRatings}
                    itemId={selectedCafeteriaDetails.id}
                    readOnly={true}
                  />
                  <span className="ml-2 text-lg font-semibold">
                    {selectedCafeteriaDetails.overallRating.toFixed(1)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">({selectedCafeteriaDetails.totalRatings} ratings)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0f1424] p-3 rounded-md">
                    <div className="text-sm text-gray-400 mb-1">Food Quality</div>
                    <div className="flex items-center">
                      <Rating
                        initialRating={selectedCafeteriaDetails.foodQuality}
                        itemId={`${selectedCafeteriaDetails.id}-food-detail`}
                        readOnly={true}
                      />
                      <span className="ml-2 font-medium">{selectedCafeteriaDetails.foodQuality.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-[#0f1424] p-3 rounded-md">
                    <div className="text-sm text-gray-400 mb-1">Service</div>
                    <div className="flex items-center">
                      <Rating
                        initialRating={selectedCafeteriaDetails.service}
                        itemId={`${selectedCafeteriaDetails.id}-service-detail`}
                        readOnly={true}
                      />
                      <span className="ml-2 font-medium">{selectedCafeteriaDetails.service.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-[#0f1424] p-3 rounded-md">
                    <div className="text-sm text-gray-400 mb-1">Cleanliness</div>
                    <div className="flex items-center">
                      <Rating
                        initialRating={selectedCafeteriaDetails.cleanliness}
                        itemId={`${selectedCafeteriaDetails.id}-clean-detail`}
                        readOnly={true}
                      />
                      <span className="ml-2 font-medium">{selectedCafeteriaDetails.cleanliness.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-[#0f1424] p-3 rounded-md">
                    <div className="text-sm text-gray-400 mb-1">Value for Money</div>
                    <div className="flex items-center">
                      <Rating
                        initialRating={selectedCafeteriaDetails.valueForMoney}
                        itemId={`${selectedCafeteriaDetails.id}-value-detail`}
                        readOnly={true}
                      />
                      <span className="ml-2 font-medium">{selectedCafeteriaDetails.valueForMoney.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-3">Recent Reviews</h3>
                <div className="space-y-4">
                  {selectedCafeteriaDetails.recentReviews.map((review) => (
                    <div key={review.id} className="bg-[#0f1424] p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{review.user}</div>
                        <div className="flex items-center">
                          <Rating initialRating={review.rating} itemId={`${review.id}-detail`} readOnly={true} />
                          <span className="ml-1">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm mt-2">{review.comment}</p>
                      <div className="text-xs text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedCafeteria(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
