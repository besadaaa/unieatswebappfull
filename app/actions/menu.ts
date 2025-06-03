"use client"

import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/lib/supabase'
import { MenuItemService, CompleteMenuItem } from '@/lib/menu-item-service'

// Load menu items from Supabase
export const getMenuItems = async (cafeteriaId?: string): Promise<MenuItem[]> => {
  try {
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (cafeteriaId) {
      query = query.eq('cafeteria_id', cafeteriaId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching menu items:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return []
  }
}

// Get menu items by category
export const getMenuItemsByCategory = async (cafeteriaId?: string) => {
  try {
    const items = await getMenuItems(cafeteriaId)

    const categorizedItems: Record<string, MenuItem[]> = {}

    items.forEach(item => {
      if (!categorizedItems[item.category]) {
        categorizedItems[item.category] = []
      }
      categorizedItems[item.category].push(item)
    })

    return categorizedItems
  } catch (error) {
    console.error('Error categorizing menu items:', error)
    return {}
  }
}

export async function addMenuItem(formData: FormData | any) {
  try {
    console.log("addMenuItem called with:", formData)
    let menuItemData: CompleteMenuItem

    if (formData instanceof FormData) {
      // Parse all form data fields
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const price = Number.parseFloat(formData.get("price") as string)
      const category = formData.get("category") as string
      const status = (formData.get("status") as string) || "available"
      const cafeteriaId = formData.get("cafeteria_id") as string || "1"
      const preparationTime = Number.parseInt(formData.get("preparation_time") as string) || 15

      // Parse nutrition info
      let nutritionInfo = {}
      const nutritionInfoStr = formData.get("nutrition_info") as string
      if (nutritionInfoStr) {
        try {
          nutritionInfo = JSON.parse(nutritionInfoStr)
        } catch (e) {
          console.warn('Invalid nutrition info JSON:', e)
        }
      }

      // Parse ingredients
      let ingredients: string[] = []
      const ingredientsStr = formData.get("ingredients") as string
      if (ingredientsStr) {
        try {
          ingredients = JSON.parse(ingredientsStr)
        } catch (e) {
          console.warn('Invalid ingredients JSON:', e)
        }
      }

      // Parse allergens
      let allergens: string[] = []
      const allergensStr = formData.get("allergens") as string
      if (allergensStr) {
        try {
          allergens = JSON.parse(allergensStr)
        } catch (e) {
          console.warn('Invalid allergens JSON:', e)
        }
      }

      // Parse customization options
      let customizationOptions: any[] = []
      const customizationOptionsStr = formData.get("customization_options") as string
      if (customizationOptionsStr) {
        try {
          customizationOptions = JSON.parse(customizationOptionsStr)
        } catch (e) {
          console.warn('Invalid customization options JSON:', e)
        }
      }

      menuItemData = {
        cafeteria_id: cafeteriaId,
        name,
        description,
        price,
        category,
        is_available: status === 'available',
        image_url: formData.get("image_url") as string || "/placeholder.svg?height=48&width=48&query=" + encodeURIComponent(name),
        nutrition_info: nutritionInfo,
        ingredients,
        allergens,
        customization_options: customizationOptions,
        preparation_time: preparationTime
      }
    } else {
      // Handle object format with comprehensive field mapping
      console.log("Processing object format data:", formData)
      console.log("Ingredients from formData:", formData.ingredients)
      console.log("Allergens from formData:", formData.allergens)
      console.log("Nutrition info from formData:", formData.nutrition_info || formData.nutritionalInfo)

      menuItemData = {
        cafeteria_id: formData.cafeteria_id || formData.cafeteriaId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        is_available: formData.is_available !== undefined ? formData.is_available :
                     formData.available !== undefined ? formData.available :
                     formData.status === 'available',
        image_url: formData.image_url || formData.image,
        nutrition_info: formData.nutrition_info || formData.nutritionalInfo || {},
        ingredients: formData.ingredients || [],
        allergens: formData.allergens || [],
        customization_options: formData.customization_options || formData.customizationOptions || [],
        preparation_time: formData.preparation_time || formData.preparationTime || 15
      }

      console.log("Final menuItemData:", menuItemData)
    }

    // Validate the menu item
    const validation = MenuItemService.validateMenuItem(menuItemData)
    if (!validation.valid) {
      return { success: false, message: validation.errors.join(', ') }
    }

    // Use the comprehensive service to create the item
    const result = await MenuItemService.createMenuItem(menuItemData)

    if (result.success) {
      return { success: true, message: "Menu item added successfully", data: result.data }
    } else {
      return { success: false, message: result.error || "Failed to add menu item" }
    }
  } catch (error) {
    console.error('Error adding menu item:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Update menu item function
export async function updateMenuItem(data: FormData | any) {
  try {
    console.log("updateMenuItem called with:", data)
    let id: string
    let updates: Partial<CompleteMenuItem> = {}

    if (data instanceof FormData) {
      id = data.get("id") as string

      // Parse all possible update fields
      const name = data.get("name") as string
      const description = data.get("description") as string
      const price = data.get("price") as string
      const category = data.get("category") as string
      const status = data.get("status") as string
      const available = data.get("available") as string
      const image_url = data.get("image_url") as string
      const preparationTime = data.get("preparation_time") as string

      if (name) updates.name = name
      if (description) updates.description = description
      if (price) updates.price = Number.parseFloat(price)
      if (category) updates.category = category
      if (image_url) updates.image_url = image_url
      if (preparationTime) updates.preparation_time = Number.parseInt(preparationTime)

      // Handle availability
      if (status) {
        updates.is_available = status === 'available'
      } else if (available) {
        updates.is_available = available === 'true'
      }

      // Parse nutrition info
      const nutritionInfoStr = data.get("nutrition_info") as string
      if (nutritionInfoStr) {
        try {
          updates.nutrition_info = JSON.parse(nutritionInfoStr)
        } catch (e) {
          console.warn('Invalid nutrition info JSON:', e)
        }
      }

      // Parse ingredients
      const ingredientsStr = data.get("ingredients") as string
      if (ingredientsStr) {
        try {
          updates.ingredients = JSON.parse(ingredientsStr)
        } catch (e) {
          console.warn('Invalid ingredients JSON:', e)
        }
      }

      // Parse allergens
      const allergensStr = data.get("allergens") as string
      if (allergensStr) {
        try {
          updates.allergens = JSON.parse(allergensStr)
        } catch (e) {
          console.warn('Invalid allergens JSON:', e)
        }
      }

      // Parse customization options
      const customizationOptionsStr = data.get("customization_options") as string
      if (customizationOptionsStr) {
        try {
          updates.customization_options = JSON.parse(customizationOptionsStr)
        } catch (e) {
          console.warn('Invalid customization options JSON:', e)
        }
      }
    } else {
      // Handle object format
      console.log("Processing object format update data:", data)
      id = data.id

      if (data.name !== undefined) updates.name = data.name
      if (data.description !== undefined) updates.description = data.description
      if (data.price !== undefined) updates.price = parseFloat(data.price)
      if (data.category !== undefined) updates.category = data.category
      if (data.image_url !== undefined || data.image !== undefined) {
        updates.image_url = data.image_url || data.image
      }
      if (data.preparation_time !== undefined || data.preparationTime !== undefined) {
        updates.preparation_time = data.preparation_time || data.preparationTime
      }

      // Handle availability
      if (data.is_available !== undefined) {
        updates.is_available = data.is_available
      } else if (data.available !== undefined) {
        updates.is_available = data.available
      } else if (data.status !== undefined) {
        updates.is_available = data.status === 'available'
      }

      // Handle complex fields
      console.log("Processing complex fields:")
      console.log("- nutrition_info:", data.nutrition_info || data.nutritionalInfo)
      console.log("- ingredients:", data.ingredients)
      console.log("- allergens:", data.allergens)

      if (data.nutrition_info !== undefined || data.nutritionalInfo !== undefined) {
        updates.nutrition_info = data.nutrition_info || data.nutritionalInfo
      }
      if (data.ingredients !== undefined) updates.ingredients = data.ingredients
      if (data.allergens !== undefined) updates.allergens = data.allergens
      if (data.customization_options !== undefined || data.customizationOptions !== undefined) {
        updates.customization_options = data.customization_options || data.customizationOptions
      }

      console.log("Final updates object:", updates)
    }

    // Use the comprehensive service to update the item
    const result = await MenuItemService.updateMenuItem(id, updates)

    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error || "Failed to update menu item")
    }
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw error
  }
}

export async function deleteMenuItem(id: string) {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting menu item:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: "Menu item deleted successfully" }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Get available inventory items for ingredients
export async function getAvailableIngredients(cafeteriaId: string) {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, quantity, unit, status')
      .eq('cafeteria_id', cafeteriaId)
      .eq('status', 'in_stock')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching inventory items:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return []
  }
}

// Check ingredient availability for menu items
export async function checkIngredientAvailability(menuItemId: string) {
  try {
    // Get menu item with ingredients
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('ingredients, cafeteria_id')
      .eq('id', menuItemId)
      .single()

    if (menuError || !menuItem?.ingredients) {
      return { available: true, missingIngredients: [] }
    }

    // Get inventory items for this cafeteria
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('name, quantity, status')
      .eq('cafeteria_id', menuItem.cafeteria_id)

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError)
      return { available: true, missingIngredients: [] }
    }

    // Check which ingredients are missing or out of stock
    const missingIngredients = menuItem.ingredients.filter((ingredient: string) => {
      const inventoryItem = inventoryItems?.find(item =>
        item.name.toLowerCase() === ingredient.toLowerCase()
      )
      return !inventoryItem || inventoryItem.status === 'out_of_stock' || inventoryItem.quantity <= 0
    })

    return {
      available: missingIngredients.length === 0,
      missingIngredients
    }
  } catch (error) {
    console.error('Error checking ingredient availability:', error)
    return { available: true, missingIngredients: [] }
  }
}
