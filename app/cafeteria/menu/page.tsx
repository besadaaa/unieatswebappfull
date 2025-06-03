"use client"

import { useState, useEffect } from "react"
import type React from "react"

import {
  PlusCircle,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { addMenuItem, updateMenuItem, deleteMenuItem, getMenuItems } from "@/app/actions/menu"
import { getCurrentUser, getCafeterias } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatCurrency } from "@/lib/currency"



// Enhanced types for better type safety
interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
  tags: string[]
  available: boolean
  preparationTime: number
  nutritionalInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  allergens: string[]
  rating: number
}

// Improved categories with more options
const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Beverages",
  "Desserts",
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Keto-Friendly",
  "Low-Calorie",
  "Protein-Rich",
]

// Enhanced allergens list
const allergenOptions = [
  "Dairy",
  "Eggs",
  "Fish",
  "Shellfish",
  "Tree Nuts",
  "Peanuts",
  "Wheat",
  "Soy",
  "Sesame",
  "Mustard",
  "Celery",
  "Lupin",
  "Molluscs",
  "Sulphites",
]

// Mock data for menu items by category with ratings
const initialMenuItems = {
  breakfast: [
    {
      id: "item-1",
      name: "Avocado Toast",
      description: "Smashed avocado on artisan bread with cherry tomatoes and microgreens",
      price: "$8.99",
      image: "/vibrant-avocado-toast.png",
      available: true,
      rating: 4.5,
      totalRatings: 28,
      tags: [],
      ratings: { average: 4.5, count: 28 },
    },
    {
      id: "item-2",
      name: "Breakfast Burrito",
      description: "Scrambled eggs, black beans, cheese, and salsa wrapped in a flour tortilla",
      price: "$9.50",
      image: "/hearty-breakfast-burrito.png",
      available: true,
      rating: 4.2,
      totalRatings: 15,
      tags: [],
      ratings: { average: 4.2, count: 15 },
    },
  ],
  lunch: [
    {
      id: "item-3",
      name: "Classic Clubhouse",
      description: "Triple-decker sandwich with turkey, bacon, lettuce, and tomato",
      price: "$10.99",
      image: "/classic-clubhouse.png",
      available: true,
      rating: 4.7,
      totalRatings: 32,
      tags: [],
      ratings: { average: 4.7, count: 32 },
    },
    {
      id: "item-4",
      name: "Colorful Garden Salad",
      description: "Mixed greens with seasonal vegetables and house dressing",
      price: "$7.99",
      image: "/colorful-garden-salad.png",
      available: true,
      rating: 4.0,
      totalRatings: 12,
      tags: [],
      ratings: { average: 4.0, count: 12 },
    },
  ],
  dinner: [
    {
      id: "item-5",
      name: "Grilled Salmon",
      description: "Wild-caught salmon with lemon herb butter, served with roasted vegetables",
      price: "$16.99",
      image: "/perfectly-grilled-salmon.png",
      available: true,
      rating: 4.8,
      totalRatings: 45,
      tags: [],
      ratings: { average: 4.8, count: 45 },
    },
    {
      id: "item-6",
      name: "Vegetable Stir Fry",
      description: "Seasonal vegetables stir-fried with tofu in a savory sauce, served over rice",
      price: "$12.50",
      image: "/vibrant-vegetable-stir-fry.png",
      available: false,
      rating: 4.1,
      totalRatings: 18,
      tags: [],
      ratings: { average: 4.1, count: 18 },
    },
  ],
  beverages: [
    {
      id: "item-7",
      name: "Fresh Fruit Smoothie",
      description: "Blend of seasonal fruits with yogurt and honey",
      price: "$5.99",
      image: "/vibrant-fruit-fusion.png",
      available: true,
      rating: 4.6,
      totalRatings: 22,
      tags: [],
      ratings: { average: 4.6, count: 22 },
    },
    {
      id: "item-8",
      name: "Iced Coffee",
      description: "Cold-brewed coffee served over ice with your choice of milk",
      price: "$4.50",
      image: "/refreshing-iced-coffee.png",
      available: true,
      rating: 4.3,
      totalRatings: 30,
      tags: [],
      ratings: { average: 4.3, count: 30 },
    },
  ],
  snacks: [
    {
      id: "item-9",
      name: "Hummus Plate",
      description: "House-made hummus with pita bread and vegetable sticks",
      price: "$6.99",
      image: "/vibrant-hummus-feast.png",
      available: true,
      rating: 4.4,
      totalRatings: 16,
      tags: [],
      ratings: { average: 4.4, count: 16 },
    },
    {
      id: "item-10",
      name: "Fruit Cup",
      description: "Assortment of fresh seasonal fruits",
      price: "$4.99",
      image: "/colorful-fruit-medley.png",
      available: true,
      rating: 4.2,
      totalRatings: 14,
      tags: [],
      ratings: { average: 4.2, count: 14 },
    },
  ],
}

// Helper function to ensure item has all required properties
const ensureItemProperties = (item: any): MenuItem => {
  return {
    id: item.id || `item-${Date.now()}`,
    name: item.name || "",
    description: item.description || "",
    price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price?.replace("$", "") || "0"),
    category: item.category || "Lunch",
    image: item.image || "/diverse-food-spread.png",
    available: item.available !== undefined ? item.available : true,
    allergens: Array.isArray(item.allergens) ? item.allergens : [],
    nutritionalInfo: {
      calories: item.nutritionalInfo?.calories || 0,
      protein: item.nutritionalInfo?.protein || 0,
      carbs: item.nutritionalInfo?.carbs || 0,
      fat: item.nutritionalInfo?.fat || 0,
    },
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    preparationTime: item.preparationTime || 15,
    featured: item.featured || false,
    specialOffer: item.specialOffer || false,
    discountPercentage: item.discountPercentage || 0,
    ratings: {
      average: item.ratings?.average || item.rating || 0,
      count: item.ratings?.count || item.totalRatings || 0,
    },
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  }
}

// Convert initial menu items to proper format
const convertInitialMenuItems = () => {
  const result: MenuItem[] = []

  Object.entries(initialMenuItems).forEach(([category, items]) => {
    items.forEach((item) => {
      result.push(
        ensureItemProperties({
          ...item,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          price: Number.parseFloat(item.price.replace("$", "")),
        }),
      )
    })
  })

  return result
}

export default function MenuPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [sortField, setSortField] = useState<keyof MenuItem>("name")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "Lunch",
    image: "",
    available: true,
    allergens: [] as string[],
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    ingredients: [] as string[],
    preparationTime: 15,
    featured: false,
    specialOffer: false,
    discountPercentage: 0,
    tags: [] as string[],
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    priceRange: { min: 0, max: 50 },
    availability: "all", // "all", "available", "unavailable"
    allergenFree: [] as string[],
    featured: false,
    specialOffer: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [newIngredient, setNewIngredient] = useState("")
  const [newTag, setNewTag] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [cachedItems, setCachedItems] = useState<MenuItem[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Enhanced useEffect with offline detection and data persistence
  useEffect(() => {
    const handleOnlineStatus = () => {
      const online = navigator.onLine
      setIsOffline(!online)

      if (online && cachedItems.length > 0) {
        // Sync cached items when coming back online
        syncCachedItems()
      }
    }

    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)

    fetchMenuItems()

    // Load cached items from localStorage
    const cached = localStorage.getItem("cachedMenuItems")
    if (cached) {
      try {
        const parsedItems = JSON.parse(cached)
        setCachedItems(parsedItems.map(ensureItemProperties))
      } catch (error) {
        console.error("Failed to parse cached items:", error)
        localStorage.removeItem("cachedMenuItems")
      }
    }

    const lastSync = localStorage.getItem("lastMenuSync")
    if (lastSync) {
      try {
        setLastSyncTime(new Date(lastSync))
      } catch (error) {
        console.error("Failed to parse last sync time:", error)
        localStorage.removeItem("lastMenuSync")
      }
    }

    return () => {
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [])

  // Sync cached items with server
  const syncCachedItems = async () => {
    if (cachedItems.length === 0) return

    setIsProcessing(true)
    toast({
      title: "Syncing changes",
      description: "Uploading your offline changes to the server...",
    })

    try {
      // Simulate API call to sync cached items
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update local state
      setMenuItems((prev) => [...prev, ...cachedItems])
      setCachedItems([])
      localStorage.removeItem("cachedMenuItems")

      const now = new Date()
      setLastSyncTime(now)
      localStorage.setItem("lastMenuSync", now.toISOString())

      toast({
        title: "Sync complete",
        description: "All changes have been synchronized with the server.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Could not synchronize changes. Will try again later.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Enhanced fetch function with caching
  const fetchMenuItems = async () => {
    setIsLoading(true)
    try {
      // Get current user and their cafeteria
      const user = await getCurrentUser()
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view menu items.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const cafeterias = await getCafeterias()
      const userCafeteria = cafeterias.find(c => c.owner_id === user.id) || cafeterias[0]

      if (!userCafeteria) {
        toast({
          title: "No Cafeteria Found",
          description: "No cafeteria available for menu management.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Get menu items filtered by cafeteria ID
      const items = await getMenuItems(userCafeteria.id)

      // Convert Supabase data to component format
      const formattedItems = items.map(item => ensureItemProperties({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number.parseFloat(item.price),
        category: item.category,
        image: item.image_url || "/diverse-food-spread.png",
        available: item.is_available,
        rating: Number.parseFloat(item.rating || "0"),
        totalRatings: item.total_ratings || 0,
        tags: [],
        allergens: [],
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        preparationTime: 15,
        featured: false,
        specialOffer: false,
        discountPercentage: 0
      }))

      setMenuItems(formattedItems)
      setFilteredItems(formattedItems)

      // Cache the items in localStorage with cafeteria ID
      localStorage.setItem(`menuItems_${userCafeteria.id}`, JSON.stringify(formattedItems))

      const now = new Date()
      setLastSyncTime(now)
      localStorage.setItem("lastMenuSync", now.toISOString())
    } catch (error) {
      console.error("Failed to fetch menu items:", error)

      // If offline, try to load from cache
      try {
        const user = await getCurrentUser()
        const cafeterias = await getCafeterias()
        const userCafeteria = cafeterias.find(c => c.owner_id === user?.id) || cafeterias[0]

        if (userCafeteria) {
          const cached = localStorage.getItem(`menuItems_${userCafeteria.id}`)
          if (cached) {
            const items = JSON.parse(cached).map(ensureItemProperties)
            setMenuItems(items)
            setFilteredItems(items)
            toast({
              title: "Using cached data",
              description: "You're offline. Showing last saved menu items.",
            })
          } else {
            setMenuItems([])
            setFilteredItems([])
            toast({
              title: "Failed to load menu items",
              description: "Could not retrieve menu data. Please try again.",
              variant: "destructive",
            })
          }
        } else {
          setMenuItems([])
          setFilteredItems([])
        }
      } catch (cacheError) {
        console.error("Failed to load cached menu items:", cacheError)
        setMenuItems([])
        setFilteredItems([])
        toast({
          title: "Failed to load menu items",
          description: "Could not retrieve menu data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters and search
  useEffect(() => {
    let result = [...menuItems]

    // Apply tab filter
    if (activeTab !== "all") {
      result = result.filter((item) => item.category.toLowerCase() === activeTab.toLowerCase())
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(query))),
      )
    }

    // Apply advanced filters
    if (showFilters) {
      // Category filter
      if (filterOptions.categories.length > 0) {
        result = result.filter((item) => filterOptions.categories.includes(item.category))
      }

      // Price range filter
      result = result.filter(
        (item) => item.price >= filterOptions.priceRange.min && item.price <= filterOptions.priceRange.max,
      )

      // Availability filter
      if (filterOptions.availability === "available") {
        result = result.filter((item) => item.available)
      } else if (filterOptions.availability === "unavailable") {
        result = result.filter((item) => !item.available)
      }

      // Allergen-free filter
      if (filterOptions.allergenFree.length > 0) {
        result = result.filter(
          (item) => !item.allergens.some((allergen) => filterOptions.allergenFree.includes(allergen)),
        )
      }

      // Featured filter
      if (filterOptions.featured) {
        result = result.filter((item) => item.featured)
      }

      // Special offer filter
      if (filterOptions.specialOffer) {
        result = result.filter((item) => item.specialOffer)
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      const fieldA = a[sortField]
      const fieldB = b[sortField]

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      } else if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA
      } else if (typeof fieldA === "boolean" && typeof fieldB === "boolean") {
        return sortOrder === "asc" ? (fieldA === fieldB ? 0 : fieldA ? -1 : 1) : fieldA === fieldB ? 0 : fieldA ? 1 : -1
      }

      return 0
    })

    setFilteredItems(result)
  }, [menuItems, activeTab, searchQuery, sortOrder, sortField, filterOptions, showFilters])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle checkbox and switch changes
  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  // Handle allergen selection
  const handleAllergenChange = (allergen: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      allergens: checked ? [...prev.allergens, allergen] : prev.allergens.filter((a) => a !== allergen),
    }))
  }

  // Add ingredient to list
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()],
      }))
      setNewIngredient("")
    }
  }

  // Remove ingredient from list
  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  // Add tag to list
  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  // Remove tag from list
  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }))
  }

  // Validate form data
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required"
    }

    if (formData.price <= 0) {
      errors.price = "Price must be greater than zero"
    }

    if (!formData.category) {
      errors.category = "Category is required"
    }

    if (formData.specialOffer && (formData.discountPercentage <= 0 || formData.discountPercentage > 100)) {
      errors.discountPercentage = "Discount must be between 1-100%"
    }

    if (formData.preparationTime <= 0) {
      errors.preparationTime = "Preparation time must be greater than zero"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission for adding new item
  const handleAddItem = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    try {
      // Get current user and cafeteria
      const user = await getCurrentUser()
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to add menu items.",
          variant: "destructive",
        })
        return
      }

      const cafeterias = await getCafeterias()
      const userCafeteria = cafeterias.find(c => c.owner_id === user.id) || cafeterias[0]

      if (!userCafeteria) {
        toast({
          title: "No Cafeteria Found",
          description: "No cafeteria available for menu management.",
          variant: "destructive",
        })
        return
      }

      // Prepare menu item data for Supabase
      const menuItemData = {
        cafeteria_id: userCafeteria.id,
        name: formData.name,
        description: formData.description,
        price: formData.price.toString(),
        category: formData.category,
        is_available: formData.available,
        image_url: formData.image || null,
        rating: "0",
        total_ratings: 0
      }

      if (isOffline) {
        // Store in cached items for later sync
        const newItem = ensureItemProperties({
          ...formData,
          id: `item-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ratings: { average: 0, count: 0 },
        })

        const updatedCache = [...cachedItems, newItem]
        setCachedItems(updatedCache)
        localStorage.setItem("cachedMenuItems", JSON.stringify(updatedCache))

        // Update UI immediately
        setMenuItems((prev) => [...prev, newItem])

        toast({
          title: "Item saved offline",
          description: "The item will be synchronized when you're back online.",
          variant: "warning",
        })
      } else {
        // Send to server using Supabase function
        const success = await addMenuItem(menuItemData)

        if (success) {
          // Reload menu items to get the latest data
          await fetchMenuItems()

          toast({
            title: "Item added successfully",
            description: `${formData.name} has been added to your menu.`,
          })
        } else {
          throw new Error("Failed to add menu item")
        }
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "Lunch",
        image: "",
        available: true,
        allergens: [],
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        ingredients: [],
        preparationTime: 15,
        featured: false,
        specialOffer: false,
        discountPercentage: 0,
        tags: [],
      })

      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add menu item:", error)
      toast({
        title: "Failed to add item",
        description: "An error occurred while adding the item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Open edit dialog with item data
  const handleEditClick = (item: MenuItem) => {
    // Ensure item has all required properties
    const safeItem = ensureItemProperties(item)
    setCurrentItem(safeItem)

    setFormData({
      name: safeItem.name,
      description: safeItem.description,
      price: safeItem.price,
      category: safeItem.category,
      image: safeItem.image,
      available: safeItem.available,
      allergens: [...safeItem.allergens],
      nutritionalInfo: { ...safeItem.nutritionalInfo },
      ingredients: [...safeItem.ingredients],
      preparationTime: safeItem.preparationTime,
      featured: safeItem.featured,
      specialOffer: safeItem.specialOffer,
      discountPercentage: safeItem.discountPercentage,
      tags: [...safeItem.tags],
    })

    setIsEditDialogOpen(true)
  }

  // Handle form submission for updating item
  const handleUpdateItem = async () => {
    if (!currentItem) {
      toast({
        title: "Error",
        description: "No item selected for update.",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before updating.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      console.log("Updating item:", currentItem.id)

      // Create a FormData object for the update
      const formDataObj = new FormData()
      formDataObj.append("id", currentItem.id.toString())
      formDataObj.append("name", formData.name)
      formDataObj.append("description", formData.description)
      formDataObj.append("price", formData.price.toString())
      formDataObj.append("category", formData.category)
      formDataObj.append("image", formData.image)
      formDataObj.append("available", formData.available.toString())
      formDataObj.append("preparationTime", formData.preparationTime.toString())
      formDataObj.append("featured", formData.featured.toString())
      formDataObj.append("specialOffer", formData.specialOffer.toString())
      formDataObj.append("discountPercentage", formData.discountPercentage.toString())
      formDataObj.append("tags", JSON.stringify(formData.tags))
      formDataObj.append("allergens", JSON.stringify(formData.allergens))
      formDataObj.append("nutritionalInfo", JSON.stringify(formData.nutritionalInfo))
      formDataObj.append("ingredients", JSON.stringify(formData.ingredients))
      formDataObj.append("updatedAt", new Date().toISOString())

      const updatedItem = {
        ...currentItem,
        ...formData,
        updatedAt: new Date().toISOString(),
      }

      if (isOffline) {
        // Update in local state and mark for sync
        setMenuItems((prev) => prev.map((item) => (item.id === currentItem.id ? updatedItem : item)))

        // Add to sync queue
        const updatedCache = [...cachedItems.filter((item) => item.id !== currentItem.id), updatedItem]
        setCachedItems(updatedCache)
        localStorage.setItem("cachedMenuItems", JSON.stringify(updatedCache))

        toast({
          title: "Item updated offline",
          description: "Changes will be synchronized when you're back online.",
          variant: "warning",
        })
      } else {
        // Send to server - use the FormData object
        await updateMenuItem(formDataObj)

        // Update local state
        setMenuItems((prev) => prev.map((item) => (item.id === currentItem.id ? updatedItem : item)))

        toast({
          title: "Item updated successfully",
          description: `${updatedItem.name} has been updated.`,
          variant: "success",
        })
      }

      setIsEditDialogOpen(false)
      setCurrentItem(null)
    } catch (error) {
      console.error("Failed to update menu item:", error)
      toast({
        title: "Failed to update item",
        description: "An error occurred while updating the item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Open delete confirmation dialog
  const handleDeleteClick = (item: MenuItem) => {
    setCurrentItem(ensureItemProperties(item))
    setIsDeleteDialogOpen(true)
  }

  // Handle item deletion
  const handleDeleteItem = async () => {
    if (!currentItem) return

    setIsProcessing(true)
    try {
      if (isOffline) {
        // Remove from local state
        setMenuItems((prev) => prev.filter((item) => item.id !== currentItem.id))

        // Add delete operation to sync queue
        const deleteOperation = { id: currentItem.id, operation: "delete", timestamp: Date.now() }
        localStorage.setItem(
          "pendingDeletes",
          JSON.stringify([...JSON.parse(localStorage.getItem("pendingDeletes") || "[]"), deleteOperation]),
        )

        toast({
          title: "Item deleted offline",
          description: "This change will be synchronized when you're back online.",
          variant: "warning",
        })
      } else {
        // Send to server
        await deleteMenuItem(currentItem.id)

        // Update local state
        setMenuItems((prev) => prev.filter((item) => item.id !== currentItem.id))

        toast({
          title: "Item deleted successfully",
          description: `${currentItem.name} has been removed from your menu.`,
          variant: "success",
        })
      }

      setIsDeleteDialogOpen(false)
      setCurrentItem(null)
    } catch (error) {
      console.error("Failed to delete menu item:", error)
      toast({
        title: "Failed to delete item",
        description: "An error occurred while deleting the item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle bulk selection
  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) => (checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)))
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? filteredItems.map((item) => item.id) : [])
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    setIsProcessing(true)
    try {
      if (isOffline) {
        // Remove from local state
        setMenuItems((prev) => prev.filter((item) => !selectedItems.includes(item.id)))

        // Add delete operations to sync queue
        const deleteOperations = selectedItems.map((id) => ({
          id,
          operation: "delete",
          timestamp: Date.now(),
        }))

        localStorage.setItem(
          "pendingDeletes",
          JSON.stringify([...JSON.parse(localStorage.getItem("pendingDeletes") || "[]"), ...deleteOperations]),
        )

        toast({
          title: "Items deleted offline",
          description: `${selectedItems.length} items deleted. Changes will sync when online.`,
          variant: "warning",
        })
      } else {
        // Delete items one by one (could be optimized with a batch delete API)
        await Promise.all(selectedItems.map((id) => deleteMenuItem(id)))

        // Update local state
        setMenuItems((prev) => prev.filter((item) => !selectedItems.includes(item.id)))

        toast({
          title: "Bulk delete successful",
          description: `${selectedItems.length} items have been removed from your menu.`,
          variant: "success",
        })
      }

      setSelectedItems([])
    } catch (error) {
      console.error("Failed to delete menu items:", error)
      toast({
        title: "Failed to delete items",
        description: "An error occurred during bulk delete. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle bulk availability toggle
  const handleBulkAvailability = async (available: boolean) => {
    if (selectedItems.length === 0) return

    setIsProcessing(true)
    try {
      if (isOffline) {
        // Update in local state
        setMenuItems((prev) =>
          prev.map((item) =>
            selectedItems.includes(item.id) ? { ...item, available, updatedAt: new Date().toISOString() } : item,
          ),
        )

        // Add update operations to sync queue
        const updateOperations = menuItems
          .filter((item) => selectedItems.includes(item.id))
          .map((item) => ({
            ...item,
            available,
            updatedAt: new Date().toISOString(),
            operation: "update",
            timestamp: Date.now(),
          }))

        const updatedCache = [...cachedItems.filter((item) => !selectedItems.includes(item.id)), ...updateOperations]
        setCachedItems(updatedCache)
        localStorage.setItem("cachedMenuItems", JSON.stringify(updatedCache))

        toast({
          title: "Items updated offline",
          description: `${selectedItems.length} items updated. Changes will sync when online.`,
          variant: "warning",
        })
      } else {
        // Update items one by one (could be optimized with a batch update API)
        const updatedItems = await Promise.all(
          menuItems
            .filter((item) => selectedItems.includes(item.id))
            .map((item) => {
              const updatedItem = {
                ...item,
                available,
                updatedAt: new Date().toISOString(),
              }
              return updateMenuItem(updatedItem)
            }),
        )

        // Update local state
        setMenuItems((prev) =>
          prev.map((item) =>
            selectedItems.includes(item.id) ? { ...item, available, updatedAt: new Date().toISOString() } : item,
          ),
        )

        toast({
          title: "Bulk update successful",
          description: `${selectedItems.length} items have been ${available ? "made available" : "marked as unavailable"}.`,
          variant: "success",
        })
      }

      setSelectedItems([])
    } catch (error) {
      console.error("Failed to update menu items:", error)
      toast({
        title: "Failed to update items",
        description: "An error occurred during bulk update. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 100)

      // Simulate API call for image upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      clearInterval(interval)
      setUploadProgress(100)

      // Create a data URL for preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setFormData((prev) => ({
          ...prev,
          image: imageUrl,
        }))

        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      }
      reader.readAsDataURL(file)

      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded and attached to this item.",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to upload image:", error)
      setIsUploading(false)
      setUploadProgress(0)

      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      // Create CSV content
      const headers = [
        "ID",
        "Name",
        "Description",
        "Price",
        "Category",
        "Available",
        "Preparation Time",
        "Featured",
        "Special Offer",
        "Discount",
        "Calories",
        "Protein",
        "Carbs",
        "Fat",
        "Allergens",
        "Ingredients",
        "Tags",
        "Rating",
        "Reviews",
      ]

      const rows = filteredItems.map((item) => [
        item.id,
        item.name,
        item.description,
        item.price,
        item.category,
        item.available ? "Yes" : "No",
        item.preparationTime,
        item.featured ? "Yes" : "No",
        item.specialOffer ? "Yes" : "No",
        item.discountPercentage,
        item.nutritionalInfo?.calories || 0,
        item.nutritionalInfo?.protein || 0,
        item.nutritionalInfo?.carbs || 0,
        item.nutritionalInfo?.fat || 0,
        (item.allergens || []).join(", "),
        (item.ingredients || []).join(", "),
        (item.tags || []).join(", "),
        item.ratings?.average || 0,
        item.ratings?.count || 0,
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","),
        ),
      ].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `menu-items-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setIsExportDialogOpen(false)

      toast({
        title: "Export successful",
        description: "Your menu items have been exported to CSV.",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to export CSV:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle CSV import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Read file
      const text = await file.text()
      const rows = text.split("\n")
      const headers = rows[0].split(",")

      // Parse CSV to items
      const newItems: MenuItem[] = []

      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue

        const values = rows[i].split(",")
        const item: any = {
          id: values[0] || `item-${Date.now()}-${i}`,
          name: values[1] || "",
          description: values[2] || "",
          price: Number.parseFloat(values[3]) || 0,
          category: values[4] || "Lunch",
          available: values[5]?.toLowerCase() === "yes",
          preparationTime: Number.parseInt(values[6]) || 15,
          featured: values[7]?.toLowerCase() === "yes",
          specialOffer: values[8]?.toLowerCase() === "yes",
          discountPercentage: Number.parseFloat(values[9]) || 0,
          nutritionalInfo: {
            calories: Number.parseFloat(values[10]) || 0,
            protein: Number.parseFloat(values[11]) || 0,
            carbs: Number.parseFloat(values[12]) || 0,
            fat: Number.parseFloat(values[13]) || 0,
          },
          allergens: values[14] ? values[14].split(", ") : [],
          ingredients: values[15] ? values[15].split(", ") : [],
          tags: values[16] ? values[16].split(", ") : [],
          ratings: {
            average: Number.parseFloat(values[17]) || 0,
            count: Number.parseInt(values[18]) || 0,
          },
          image: "/diverse-food-spread.png",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        newItems.push(ensureItemProperties(item))
      }

      if (newItems.length === 0) {
        throw new Error("No valid items found in CSV")
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (isOffline) {
        // Store in cached items for later sync
        const updatedCache = [...cachedItems, ...newItems]
        setCachedItems(updatedCache)
        localStorage.setItem("cachedMenuItems", JSON.stringify(updatedCache))

        // Update UI immediately
        setMenuItems((prev) => [...prev, ...newItems])

        toast({
          title: "Items imported offline",
          description: `${newItems.length} items imported. They will sync when you're online.`,
          variant: "warning",
        })
      } else {
        // Add items to server
        await Promise.all(newItems.map((item) => addMenuItem(item)))

        // Update local state
        setMenuItems((prev) => [...prev, ...newItems])

        toast({
          title: "Import successful",
          description: `${newItems.length} items have been imported to your menu.`,
          variant: "success",
        })
      }

      setIsImportDialogOpen(false)
    } catch (error) {
      console.error("Failed to import CSV:", error)
      toast({
        title: "Import failed",
        description: "An error occurred while importing. Please check your CSV format and try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle sort change
  const handleSortChange = (field: keyof MenuItem) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-6 h-64">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 animate-slide-in-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text animate-shimmer">Menu Management</h1>
          <p className="text-slate-400 mt-2">Create, edit and manage your menu items</p>
          {isOffline && (
            <Badge variant="outline" className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-300">
              Offline Mode - Changes will sync when you're back online
            </Badge>
          )}
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground mt-1">Last synced: {lastSyncTime.toLocaleString()}</p>
          )}
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 animate-slide-in-right">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>Fill in the details to add a new item to your menu.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                    <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Item name"
                          className={formErrors.name ? "border-red-500" : ""}
                        />
                        {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Item description"
                          className={formErrors.description ? "border-red-500" : ""}
                        />
                        {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (EGP)</Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            className={formErrors.price ? "border-red-500" : ""}
                          />
                          {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            name="category"
                            value={formData.category}
                            onValueChange={(value) => {
                              setFormData((prev) => ({ ...prev, category: value }))
                            }}
                          >
                            <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.category && <p className="text-red-500 text-sm">{formErrors.category}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Image</Label>
                        <div className="flex items-center space-x-4">
                          <div className="relative w-24 h-24 border rounded overflow-hidden">
                            {formData.image ? (
                              <img
                                src={formData.image || "/placeholder.svg"}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                No image
                              </div>
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="w-full px-4">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 transition-all duration-300"
                                      style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <Label
                              htmlFor="image-upload"
                              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
                            >
                              {isUploading ? "Uploading..." : "Upload Image"}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP, max 5MB</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="available"
                          checked={formData.available}
                          onCheckedChange={(checked) => handleToggleChange("available", checked)}
                        />
                        <Label htmlFor="available">Available for ordering</Label>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="nutrition" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="calories">Calories</Label>
                        <Input
                          id="calories"
                          name="nutritionalInfo.calories"
                          type="number"
                          min="0"
                          value={formData.nutritionalInfo.calories}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="protein">Protein (g)</Label>
                        <Input
                          id="protein"
                          name="nutritionalInfo.protein"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo.protein}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="carbs">Carbs (g)</Label>
                        <Input
                          id="carbs"
                          name="nutritionalInfo.carbs"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo.carbs}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fat">Fat (g)</Label>
                        <Input
                          id="fat"
                          name="nutritionalInfo.fat"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo.fat}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Allergens</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allergenOptions.map((allergen) => (
                          <div key={allergen} className="flex items-center space-x-2">
                            <Checkbox
                              id={`allergen-${allergen}`}
                              checked={formData.allergens.includes(allergen)}
                              onCheckedChange={(checked) => handleAllergenChange(allergen, checked as boolean)}
                            />
                            <Label htmlFor={`allergen-${allergen}`}>{allergen}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="ingredients" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ingredients">Ingredients</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="new-ingredient"
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          placeholder="Add ingredient"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddIngredient()
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddIngredient} disabled={!newIngredient.trim()}>
                          Add
                        </Button>
                      </div>
                      <div className="mt-2">
                        {formData.ingredients.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formData.ingredients.map((ingredient, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {ingredient}
                                <button
                                  type="button"
                                  className="ml-1 rounded-full hover:bg-gray-200 p-1"
                                  onClick={() => handleRemoveIngredient(index)}
                                  aria-label={`Remove ${ingredient}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No ingredients added yet</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="new-tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                          Add
                        </Button>
                      </div>
                      <div className="mt-2">
                        {formData.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} className="flex items-center gap-1">
                                {tag}
                                <button
                                  type="button"
                                  className="ml-1 rounded-full hover:bg-gray-200 p-1"
                                  onClick={() => handleRemoveTag(index)}
                                  aria-label={`Remove ${tag}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No tags added yet</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="options" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preparationTime">Preparation Time (minutes)</Label>
                      <Input
                        id="preparationTime"
                        name="preparationTime"
                        type="number"
                        min="1"
                        value={formData.preparationTime}
                        onChange={handleInputChange}
                        placeholder="15"
                        className={formErrors.preparationTime ? "border-red-500" : ""}
                      />
                      {formErrors.preparationTime && (
                        <p className="text-red-500 text-sm">{formErrors.preparationTime}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => handleToggleChange("featured", checked)}
                      />
                      <Label htmlFor="featured">Featured item</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="specialOffer"
                        checked={formData.specialOffer}
                        onCheckedChange={(checked) => handleToggleChange("specialOffer", checked)}
                      />
                      <Label htmlFor="specialOffer">Special offer</Label>
                    </div>
                    {formData.specialOffer && (
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                        <Input
                          id="discountPercentage"
                          name="discountPercentage"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.discountPercentage}
                          onChange={handleInputChange}
                          placeholder="10"
                          className={formErrors.discountPercentage ? "border-red-500" : ""}
                        />
                        {formErrors.discountPercentage && (
                          <p className="text-red-500 text-sm">{formErrors.discountPercentage}</p>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} disabled={isProcessing}>
                  {isProcessing ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Menu Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)} disabled={isOffline && !navigator.onLine}>
                <Upload className="mr-2 h-4 w-4" />
                Import Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export Items
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAvailability(true)} disabled={selectedItems.length === 0}>
                Mark Selected as Available
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAvailability(false)} disabled={selectedItems.length === 0}>
                Mark Selected as Unavailable
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBulkDelete}
                disabled={selectedItems.length === 0}
                className="text-red-600"
              >
                Delete Selected
              </DropdownMenuItem>
              {isOffline && cachedItems.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={syncCachedItems} disabled={!navigator.onLine}>
                    Sync Offline Changes ({cachedItems.length})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
            <TabsTrigger value="beverages">Beverages</TabsTrigger>
            <TabsTrigger value="desserts">Desserts</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card id="filter-panel" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories &&
                  categories.slice(0, 8).map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-category-${category}`}
                        checked={filterOptions.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          setFilterOptions((prev) => ({
                            ...prev,
                            categories: checked
                              ? [...prev.categories, category]
                              : prev.categories.filter((c) => c !== category),
                          }))
                        }}
                      />
                      <Label htmlFor={`filter-category-${category}`}>{category}</Label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filterOptions.priceRange.min}
                    onChange={(e) => {
                      setFilterOptions((prev) => ({
                        ...prev,
                        priceRange: {
                          ...prev.priceRange,
                          min: Number.parseFloat(e.target.value) || 0,
                        },
                      }))
                    }}
                    placeholder="Min"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filterOptions.priceRange.max}
                    onChange={(e) => {
                      setFilterOptions((prev) => ({
                        ...prev,
                        priceRange: {
                          ...prev.priceRange,
                          max: Number.parseFloat(e.target.value) || 0,
                        },
                      }))
                    }}
                    placeholder="Max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={filterOptions.availability}
                  onValueChange={(value) => {
                    setFilterOptions((prev) => ({
                      ...prev,
                      availability: value,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="unavailable">Unavailable Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Filters</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-featured"
                    checked={filterOptions.featured}
                    onCheckedChange={(checked) => {
                      setFilterOptions((prev) => ({
                        ...prev,
                        featured: checked as boolean,
                      }))
                    }}
                  />
                  <Label htmlFor="filter-featured">Featured Items Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-special-offer"
                    checked={filterOptions.specialOffer}
                    onCheckedChange={(checked) => {
                      setFilterOptions((prev) => ({
                        ...prev,
                        specialOffer: checked as boolean,
                      }))
                    }}
                  />
                  <Label htmlFor="filter-special-offer">Special Offers Only</Label>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Allergen-Free</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allergenOptions &&
                    allergenOptions.slice(0, 6).map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-allergen-${allergen}`}
                          checked={filterOptions.allergenFree.includes(allergen)}
                          onCheckedChange={(checked) => {
                            setFilterOptions((prev) => ({
                              ...prev,
                              allergenFree: checked
                                ? [...prev.allergenFree, allergen]
                                : prev.allergenFree.filter((a) => a !== allergen),
                            }))
                          }}
                        />
                        <Label htmlFor={`filter-allergen-${allergen}`}>{allergen}</Label>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilterOptions({
                  categories: [],
                  priceRange: { min: 0, max: 50 },
                  availability: "all",
                  allergenFree: [],
                  featured: false,
                  specialOffer: false,
                })
              }}
            >
              Reset Filters
            </Button>
            <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedItems.length > 0 && selectedItems.length === filteredItems.length}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all">Select All</Label>
          {selectedItems.length > 0 && <Badge variant="outline">{selectedItems.length} selected</Badge>}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleSortChange("name")} className="text-sm">
            Name
            {sortField === "name" && (
              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === "asc" ? "rotate-0" : "rotate-180"}`} />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleSortChange("price")} className="text-sm">
            Price
            {sortField === "price" && (
              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === "asc" ? "rotate-0" : "rotate-180"}`} />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleSortChange("category")} className="text-sm">
            Category
            {sortField === "category" && (
              <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === "asc" ? "rotate-0" : "rotate-180"}`} />
            )}
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <Search className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No items found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("")
              setFilterOptions({
                categories: [],
                priceRange: { min: 0, max: 50 },
                availability: "all",
                allergenFree: [],
                featured: false,
                specialOffer: false,
              })
              setActiveTab("all")
            }}
          >
            Reset all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    id={`select-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    className="bg-white"
                  />
                </div>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/diverse-food-spread.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                {!item.available && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      Unavailable
                    </Badge>
                  </div>
                )}
                {item.specialOffer && (
                  <Badge className="absolute top-2 right-2 bg-red-500">{item.discountPercentage}% OFF</Badge>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(typeof item.price === "number" ? item.price : 0)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.featured && <Badge variant="secondary">Featured</Badge>}
                  {item.tags &&
                    item.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="outline" className="bg-gray-100">
                        {tag}
                      </Badge>
                    ))}
                  {item.tags && item.tags.length > 2 && (
                    <Badge variant="outline" className="bg-gray-100">
                      +{item.tags.length - 2} more
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Prep time:</span> {item.preparationTime} min
                  </div>
                  {item.ratings && item.ratings.count > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Rating:</span>
                      {item.ratings.average.toFixed(1)} ({item.ratings.count} reviews)
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(item)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const updatedItem = {
                          ...item,
                          available: !item.available,
                        }
                        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)))
                      }}
                    >
                      {item.available ? <>Mark as Unavailable</> : <>Mark as Available</>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(item)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update the details of this menu item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>
              {/* Same tab content as Add Dialog */}
              <TabsContent value="basic" className="space-y-4">
                {/* Same content as Add Dialog */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Item name"
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Item description"
                      className={formErrors.description ? "border-red-500" : ""}
                    />
                    {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price (EGP)</Label>
                      <Input
                        id="edit-price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className={formErrors.price ? "border-red-500" : ""}
                      />
                      {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        name="category"
                        value={formData.category}
                        onValueChange={(value) => {
                          setFormData((prev) => ({ ...prev, category: value }))
                        }}
                      >
                        <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.category && <p className="text-red-500 text-sm">{formErrors.category}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Image</Label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-24 h-24 border rounded overflow-hidden">
                        {formData.image ? (
                          <img
                            src={formData.image || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="w-full px-4">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          id="edit-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <Label
                          htmlFor="edit-image-upload"
                          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
                        >
                          {isUploading ? "Uploading..." : "Upload Image"}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP, max 5MB</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-available"
                      checked={formData.available}
                      onCheckedChange={(checked) => handleToggleChange("available", checked)}
                    />
                    <Label htmlFor="edit-available">Available for ordering</Label>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="nutrition" className="space-y-4">
                {/* Same content as Add Dialog */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-calories">Calories</Label>
                    <Input
                      id="edit-calories"
                      name="nutritionalInfo.calories"
                      type="number"
                      min="0"
                      value={formData.nutritionalInfo.calories}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-protein">Protein (g)</Label>
                    <Input
                      id="edit-protein"
                      name="nutritionalInfo.protein"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.nutritionalInfo.protein}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-carbs">Carbs (g)</Label>
                    <Input
                      id="edit-carbs"
                      name="nutritionalInfo.carbs"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.nutritionalInfo.carbs}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fat">Fat (g)</Label>
                    <Input
                      id="edit-fat"
                      name="nutritionalInfo.fat"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.nutritionalInfo.fat}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Allergens</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allergenOptions.map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-allergen-${allergen}`}
                          checked={formData.allergens.includes(allergen)}
                          onCheckedChange={(checked) => handleAllergenChange(allergen, checked as boolean)}
                        />
                        <Label htmlFor={`edit-allergen-${allergen}`}>{allergen}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ingredients" className="space-y-4">
                {/* Same content as Add Dialog */}
                <div className="space-y-2">
                  <Label htmlFor="edit-ingredients">Ingredients</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="edit-new-ingredient"
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      placeholder="Add ingredient"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddIngredient()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddIngredient} disabled={!newIngredient.trim()}>
                      Add
                    </Button>
                  </div>
                  <div className="mt-2">
                    {formData.ingredients.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.ingredients.map((ingredient, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {ingredient}
                            <button
                              type="button"
                              className="ml-1 rounded-full hover:bg-gray-200 p-1"
                              onClick={() => handleRemoveIngredient(index)}
                              aria-label={`Remove ${ingredient}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No ingredients added yet</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="edit-new-tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                      Add
                    </Button>
                  </div>
                  <div className="mt-2">
                    {formData.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              className="ml-1 rounded-full hover:bg-gray-200 p-1"
                              onClick={() => handleRemoveTag(index)}
                              aria-label={`Remove ${tag}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags added yet</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="options" className="space-y-4">
                {/* Same content as Add Dialog */}
                <div className="space-y-2">
                  <Label htmlFor="edit-preparationTime">Preparation Time (minutes)</Label>
                  <Input
                    id="edit-preparationTime"
                    name="preparationTime"
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={handleInputChange}
                    placeholder="15"
                    className={formErrors.preparationTime ? "border-red-500" : ""}
                  />
                  {formErrors.preparationTime && <p className="text-red-500 text-sm">{formErrors.preparationTime}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleToggleChange("featured", checked)}
                  />
                  <Label htmlFor="edit-featured">Featured item</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-specialOffer"
                    checked={formData.specialOffer}
                    onCheckedChange={(checked) => handleToggleChange("specialOffer", checked)}
                  />
                  <Label htmlFor="edit-specialOffer">Special offer</Label>
                </div>
                {formData.specialOffer && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="edit-discountPercentage">Discount Percentage (%)</Label>
                    <Input
                      id="edit-discountPercentage"
                      name="discountPercentage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={handleInputChange}
                      placeholder="10"
                      className={formErrors.discountPercentage ? "border-red-500" : ""}
                    />
                    {formErrors.discountPercentage && (
                      <p className="text-red-500 text-sm">{formErrors.discountPercentage}</p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateItem()}
              disabled={isProcessing}
              type="button"
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentItem && (
              <div className="flex items-center space-x-4">
                {currentItem.image && (
                  <img
                    src={currentItem.image || "/placeholder.svg"}
                    alt={currentItem.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h4 className="font-medium">{currentItem.name}</h4>
                  <p className="text-sm text-muted-foreground">{currentItem.category}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Menu Items</DialogTitle>
            <DialogDescription>Upload a CSV file to import multiple menu items at once.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                disabled={isProcessing}
              />
              <Label htmlFor="csv-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Click to upload CSV file</span>
                <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">CSV Format:</p>
              <p>Your CSV should include the following columns:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>ID (optional)</li>
                <li>Name (required)</li>
                <li>Description (required)</li>
                <li>Price (required)</li>
                <li>Category (required)</li>
                <li>Available (Yes/No)</li>
                <li>And other optional fields...</li>
              </ul>
              <p className="mt-2">
                <a href="#" className="text-primary underline">
                  Download template
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Menu Items</DialogTitle>
            <DialogDescription>Export your menu items to a CSV file.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Export Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="export-all" defaultChecked />
                <Label htmlFor="export-all">Export all items</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="export-filtered" />
                <Label htmlFor="export-filtered">Export filtered items only ({filteredItems.length})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="export-selected" disabled={selectedItems.length === 0} />
                <Label htmlFor="export-selected">Export selected items only ({selectedItems.length})</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Include Fields</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-basic" defaultChecked />
                  <Label htmlFor="include-basic">Basic information</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-nutrition" defaultChecked />
                  <Label htmlFor="include-nutrition">Nutritional information</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-ingredients" defaultChecked />
                  <Label htmlFor="include-ingredients">Ingredients</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-ratings" defaultChecked />
                  <Label htmlFor="include-ratings">Ratings and reviews</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCSV}>Export to CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
