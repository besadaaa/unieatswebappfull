"use client"

import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/lib/supabase'

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
    let itemData: Partial<MenuItem>

    if (formData instanceof FormData) {
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const price = Number.parseFloat(formData.get("price") as string)
      const category = formData.get("category") as string
      const status = (formData.get("status") as string) || "available"
      const cafeteriaId = formData.get("cafeteria_id") as string || "1"

      // Parse nutrition info if provided
      const nutritionInfo = formData.get("nutrition_info") as string
      let parsedNutritionInfo = null
      if (nutritionInfo) {
        try {
          parsedNutritionInfo = JSON.parse(nutritionInfo)
        } catch (e) {
          console.warn('Invalid nutrition info JSON:', e)
        }
      }

      // Parse ingredients if provided
      const ingredients = formData.get("ingredients") as string
      let parsedIngredients = null
      if (ingredients) {
        try {
          parsedIngredients = JSON.parse(ingredients)
        } catch (e) {
          console.warn('Invalid ingredients JSON:', e)
        }
      }

      // Parse customization options if provided
      const customizationOptions = formData.get("customization_options") as string
      let parsedCustomizationOptions = null
      if (customizationOptions) {
        try {
          parsedCustomizationOptions = JSON.parse(customizationOptions)
        } catch (e) {
          console.warn('Invalid customization options JSON:', e)
        }
      }

      itemData = {
        cafeteria_id: cafeteriaId,
        name,
        description,
        price,
        category,
        is_available: status === 'available',
        image_url: "/placeholder.svg?height=48&width=48&query=" + encodeURIComponent(name),
        nutrition_info: parsedNutritionInfo,
        ingredients: parsedIngredients,
        customization_options: parsedCustomizationOptions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } else {
      // If it's already an object, handle both formats
      itemData = {
        cafeteria_id: formData.cafeteria_id || formData.cafeteriaId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        is_available: formData.is_available !== undefined ? formData.is_available :
                     formData.available !== undefined ? formData.available :
                     formData.status === 'available',
        image_url: formData.image_url || formData.image || "/placeholder.svg?height=48&width=48&query=" + encodeURIComponent(formData.name),
        nutrition_info: formData.nutrition_info || formData.nutritionalInfo,
        ingredients: formData.ingredients,
        customization_options: formData.customization_options || formData.customizationOptions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert([itemData])
      .select()
      .single()

    if (error) {
      console.error('Error adding menu item:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: "Menu item added successfully", data }
  } catch (error) {
    console.error('Error adding menu item:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Update menu item function
export async function updateMenuItem(data: FormData | any) {
  try {
    let itemData: Partial<MenuItem> & { id: string }

    if (data instanceof FormData) {
      const id = data.get("id") as string
      const name = data.get("name") as string
      const description = data.get("description") as string
      const price = Number.parseFloat(data.get("price") as string)
      const category = data.get("category") as string
      const status = data.get("status") as string
      const available = data.get("available") as string
      const image_url = data.get("image_url") as string

      // Parse nutrition info if provided
      const nutritionInfo = data.get("nutrition_info") as string
      let parsedNutritionInfo = null
      if (nutritionInfo) {
        try {
          parsedNutritionInfo = JSON.parse(nutritionInfo)
        } catch (e) {
          console.warn('Invalid nutrition info JSON:', e)
        }
      }

      // Parse ingredients if provided
      const ingredients = data.get("ingredients") as string
      let parsedIngredients = null
      if (ingredients) {
        try {
          parsedIngredients = JSON.parse(ingredients)
        } catch (e) {
          console.warn('Invalid ingredients JSON:', e)
        }
      }

      // Parse customization options if provided
      const customizationOptions = data.get("customization_options") as string
      let parsedCustomizationOptions = null
      if (customizationOptions) {
        try {
          parsedCustomizationOptions = JSON.parse(customizationOptions)
        } catch (e) {
          console.warn('Invalid customization options JSON:', e)
        }
      }

      // Handle availability - check both status and available fields
      let isAvailable = true
      if (status) {
        isAvailable = status === 'available'
      } else if (available) {
        isAvailable = available === 'true'
      }

      itemData = {
        id,
        name,
        description,
        price,
        category,
        is_available: isAvailable,
        image_url,
        nutrition_info: parsedNutritionInfo,
        ingredients: parsedIngredients,
        customization_options: parsedCustomizationOptions,
        updated_at: new Date().toISOString()
      }
    } else {
      // If data is already an object, handle both formats
      itemData = {
        id: data.id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        is_available: data.is_available !== undefined ? data.is_available :
                     data.available !== undefined ? data.available :
                     data.status === 'available',
        image_url: data.image_url || data.image,
        nutrition_info: data.nutrition_info || data.nutritionalInfo,
        ingredients: data.ingredients,
        customization_options: data.customization_options || data.customizationOptions,
        updated_at: new Date().toISOString()
      }
    }

    const { data: updatedItem, error } = await supabase
      .from('menu_items')
      .update(itemData)
      .eq('id', itemData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating menu item:", error)
      throw new Error(error.message)
    }

    return updatedItem
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
