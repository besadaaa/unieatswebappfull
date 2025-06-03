"use client"

import type React from "react"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, MoreVertical, Edit, Trash, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  getInventoryItems,
  saveInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getCurrentUser,
  getCafeterias,
  type InventoryItem
} from "@/lib/supabase"

// Inventory categories for the dropdown
const INVENTORY_CATEGORIES = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "grains",
  "beverages",
  "condiments",
  "frozen",
  "other"
]

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cafeteriaId, setCafeteriaId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "produce",
    quantity: "",
    unit: "",
    min_quantity: "",
  })
  const [editedItem, setEditedItem] = useState({
    id: "",
    name: "",
    category: "",
    quantity: "",
    unit: "",
    min_quantity: "",
  })

  // Load inventory data on component mount
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true)
        const user = await getCurrentUser()
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to view inventory.",
            variant: "destructive",
          })
          return
        }

        // Get user's cafeteria
        const cafeterias = await getCafeterias()
        const userCafeteria = cafeterias.find(c => c.owner_id === user.id)

        if (!userCafeteria) {
          // If user doesn't own a cafeteria, use the first available one for demo
          const firstCafeteria = cafeterias[0]
          if (firstCafeteria) {
            setCafeteriaId(firstCafeteria.id)
            const items = await getInventoryItems(firstCafeteria.id)
            setInventoryItems(items)
          } else {
            toast({
              title: "No Cafeteria Found",
              description: "No cafeteria available for inventory management.",
              variant: "destructive",
            })
          }
        } else {
          setCafeteriaId(userCafeteria.id)
          const items = await getInventoryItems(userCafeteria.id)
          setInventoryItems(items)
        }
      } catch (error) {
        console.error('Error loading inventory:', error)
        toast({
          title: "Error",
          description: "Failed to load inventory data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInventoryData()
  }, [])

  // Filter inventory items based on search query, category, and status
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Search Results",
      description: `Showing results for: ${searchQuery}`,
    })
  }

  // Calculate status based on quantity and min_quantity
  const calculateStatus = (quantity: number, min_quantity: number) => {
    if (quantity <= 0) {
      return "out-of-stock"
    } else if (quantity < min_quantity) {
      return "low"
    } else {
      return "in-stock"
    }
  }

  // Handle adding a new item
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.unit || !newItem.min_quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!cafeteriaId) {
      toast({
        title: "Error",
        description: "Cafeteria ID not found",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseFloat(newItem.quantity)
    const min_quantity = Number.parseFloat(newItem.min_quantity)

    if (isNaN(quantity) || isNaN(min_quantity)) {
      toast({
        title: "Error",
        description: "Quantity and minimum quantity must be numbers",
        variant: "destructive",
      })
      return
    }

    const status = calculateStatus(quantity, min_quantity)

    const newInventoryItem = {
      cafeteria_id: cafeteriaId,
      name: newItem.name,
      category: newItem.category,
      quantity,
      unit: newItem.unit,
      min_quantity,
      status,
    }

    try {
      const success = await saveInventoryItem(newInventoryItem)

      if (success) {
        // Reload inventory data
        const items = await getInventoryItems(cafeteriaId)
        setInventoryItems(items)

        toast({
          title: "Item Added",
          description: `${newItem.name} has been added to inventory.`,
        })

        setAddItemDialogOpen(false)
        setNewItem({
          name: "",
          category: "produce",
          quantity: "",
          unit: "",
          min_quantity: "",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to inventory.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding inventory item:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle editing an item
  const handleEditItem = async () => {
    if (!editedItem.name || !editedItem.quantity || !editedItem.unit || !editedItem.min_quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseFloat(editedItem.quantity)
    const min_quantity = Number.parseFloat(editedItem.min_quantity)

    if (isNaN(quantity) || isNaN(min_quantity)) {
      toast({
        title: "Error",
        description: "Quantity and minimum quantity must be numbers",
        variant: "destructive",
      })
      return
    }

    const status = calculateStatus(quantity, min_quantity)

    try {
      const success = await updateInventoryItem(editedItem.id, {
        name: editedItem.name,
        category: editedItem.category,
        quantity,
        unit: editedItem.unit,
        min_quantity,
        status,
      })

      if (success && cafeteriaId) {
        // Reload inventory data
        const items = await getInventoryItems(cafeteriaId)
        setInventoryItems(items)

        toast({
          title: "Item Updated",
          description: `${editedItem.name} has been updated.`,
        })

        setEditItemDialogOpen(false)
        setSelectedItem(null)
      } else {
        toast({
          title: "Error",
          description: "Failed to update item.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating inventory item:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting an item
  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      const success = await deleteInventoryItem(item.id)

      if (success && cafeteriaId) {
        // Reload inventory data
        const items = await getInventoryItems(cafeteriaId)
        setInventoryItems(items)

        toast({
          title: "Item Deleted",
          description: `${item.name} has been removed from inventory.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete item.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-500"
      case "low":
        return "bg-yellow-500"
      case "out-of-stock":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Format status text
  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="flex-1 p-6 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center animate-slide-in-up">
          <h1 className="text-3xl font-bold gradient-text animate-shimmer">Inventory Management</h1>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search inventory..."
                className="pl-10 glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>Add a new item to your inventory</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    >
                      {INVENTORY_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        placeholder="e.g., lbs, each, bags"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="min_quantity">Minimum Quantity</Label>
                    <Input
                      id="min_quantity"
                      type="number"
                      value={newItem.min_quantity}
                      onChange={(e) => setNewItem({ ...newItem, min_quantity: e.target.value })}
                      placeholder="Alert when below this quantity"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <Label htmlFor="category-filter" className="text-sm font-medium mb-2 block">
              Category
            </Label>
            <select
              id="category-filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="produce">Produce</option>
              <option value="meat">Meat</option>
              <option value="dairy">Dairy</option>
              <option value="bakery">Bakery</option>
              <option value="grains">Grains</option>
              <option value="beverages">Beverages</option>
            </select>
          </div>

          <div className="w-1/2">
            <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
              Status
            </Label>
            <select
              id="status-filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(item.status)}>{formatStatus(item.status)}</Badge>
                      {item.status === "low" && <AlertTriangle className="inline ml-2 h-4 w-4 text-yellow-500" />}
                    </TableCell>
                    <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item)
                              setEditedItem({
                                id: item.id,
                                name: item.name,
                                category: item.category,
                                quantity: item.quantity.toString(),
                                unit: item.unit,
                                min_quantity: item.min_quantity.toString(),
                              })
                              setEditItemDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteItem(item)} className="text-red-500">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Item Dialog */}
        <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update the details of this inventory item</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={editedItem.name}
                  onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editedItem.category}
                  onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value })}
                >
                  <option value="produce">Produce</option>
                  <option value="meat">Meat</option>
                  <option value="dairy">Dairy</option>
                  <option value="bakery">Bakery</option>
                  <option value="grains">Grains</option>
                  <option value="beverages">Beverages</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editedItem.quantity}
                    onChange={(e) => setEditedItem({ ...editedItem, quantity: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Input
                    id="edit-unit"
                    value={editedItem.unit}
                    onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-min-quantity">Minimum Quantity</Label>
                <Input
                  id="edit-min-quantity"
                  type="number"
                  value={editedItem.min_quantity}
                  onChange={(e) => setEditedItem({ ...editedItem, min_quantity: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
  )
}
