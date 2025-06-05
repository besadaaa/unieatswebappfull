import { supabase } from './supabase'

// Complete menu item interface with all fields
export interface CompleteMenuItem {
  // Basic Info
  id?: string
  cafeteria_id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  
  // Nutrition Info
  nutrition_info?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
    sodium?: number
    cholesterol?: number
  }
  
  // Ingredients
  ingredients?: string[]
  allergens?: string[]
  
  // Customization Options
  customization_options?: {
    name: string
    type: 'single' | 'multiple'
    required: boolean
    options: {
      name: string
      price: number
      available: boolean
    }[]
  }[]
  
  // Additional fields
  preparation_time?: number
  rating?: number
  total_ratings?: number
  created_at?: string
  updated_at?: string
}

export class MenuItemService {
  // Create a new menu item with all fields
  static async createMenuItem(menuItem: CompleteMenuItem): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const itemData = {
        cafeteria_id: menuItem.cafeteria_id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        image_url: menuItem.image_url || null,
        is_available: menuItem.is_available ?? true,
        nutrition_info: menuItem.nutrition_info || {},
        ingredients: menuItem.ingredients || [],
        allergens: menuItem.allergens || [],
        customization_options: menuItem.customization_options || [],
        preparation_time: menuItem.preparation_time || 15,
        rating: menuItem.rating || 0,
        total_ratings: menuItem.total_ratings || 0
      }

      console.log("Final itemData for Supabase:", itemData)

      // Ensure arrays are properly formatted
      if (itemData.ingredients && Array.isArray(itemData.ingredients)) {
        console.log("Ingredients array:", itemData.ingredients)
      }
      if (itemData.allergens && Array.isArray(itemData.allergens)) {
        console.log("Allergens array:", itemData.allergens)
      }
      if (itemData.nutrition_info) {
        console.log("Nutrition info object:", itemData.nutrition_info)
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert([itemData])
        .select()
        .single()

      console.log("Supabase insert result:", { data, error })

      if (error) {
        console.error('Error creating menu item:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error creating menu item:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Update a menu item with all fields
  static async updateMenuItem(id: string, updates: Partial<CompleteMenuItem>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log("MenuItemService.updateMenuItem called with:", { id, updates })

      const updateData: any = {}

      // Basic Info
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.price !== undefined) updateData.price = updates.price
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url
      if (updates.is_available !== undefined) updateData.is_available = updates.is_available

      // Nutrition Info
      if (updates.nutrition_info !== undefined) updateData.nutrition_info = updates.nutrition_info

      // Ingredients
      if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients
      if (updates.allergens !== undefined) updateData.allergens = updates.allergens

      // Customization Options
      if (updates.customization_options !== undefined) updateData.customization_options = updates.customization_options

      // Additional fields
      if (updates.preparation_time !== undefined) updateData.preparation_time = updates.preparation_time

      console.log("Final updateData for Supabase:", updateData)

      // Ensure arrays are properly formatted
      if (updateData.ingredients && Array.isArray(updateData.ingredients)) {
        console.log("Ingredients array:", updateData.ingredients)
      }
      if (updateData.allergens && Array.isArray(updateData.allergens)) {
        console.log("Allergens array:", updateData.allergens)
      }
      if (updateData.nutrition_info) {
        console.log("Nutrition info object:", updateData.nutrition_info)
      }

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      console.log("Supabase update result:", { data, error })

      if (error) {
        console.error('Error updating menu item:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating menu item:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get menu item by ID with all fields
  static async getMenuItem(id: string): Promise<CompleteMenuItem | null> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching menu item:', error)
        return null
      }

      return this.formatMenuItem(data)
    } catch (error) {
      console.error('Error fetching menu item:', error)
      return null
    }
  }

  // Get all menu items for a cafeteria with all fields
  static async getMenuItemsByCafeteria(cafeteriaId: string): Promise<CompleteMenuItem[]> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafeteria_id', cafeteriaId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching menu items:', error)
        return []
      }

      return (data || []).map(item => this.formatMenuItem(item))
    } catch (error) {
      console.error('Error fetching menu items:', error)
      return []
    }
  }

  // Delete a menu item
  static async deleteMenuItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting menu item:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Format raw database data to CompleteMenuItem
  private static formatMenuItem(data: any): CompleteMenuItem {
    return {
      id: data.id,
      cafeteria_id: data.cafeteria_id,
      name: data.name || '',
      description: data.description || '',
      price: parseFloat(data.price) || 0,
      category: data.category || '',
      image_url: data.image_url,
      is_available: data.is_available ?? true,
      nutrition_info: data.nutrition_info || {},
      ingredients: data.ingredients || [],
      allergens: data.allergens || [],
      customization_options: data.customization_options || [],
      preparation_time: data.preparation_time || 15,
      rating: parseFloat(data.rating) || 0,
      total_ratings: data.total_ratings || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // Validate menu item data
  static validateMenuItem(menuItem: Partial<CompleteMenuItem>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Basic Info validation
    if (!menuItem.name || menuItem.name.trim().length === 0) {
      errors.push('Name is required')
    }
    if (!menuItem.description || menuItem.description.trim().length === 0) {
      errors.push('Description is required')
    }
    if (!menuItem.price || menuItem.price <= 0) {
      errors.push('Price must be greater than 0')
    }
    if (!menuItem.category || menuItem.category.trim().length === 0) {
      errors.push('Category is required')
    }

    // Nutrition validation
    if (menuItem.nutrition_info) {
      const nutrition = menuItem.nutrition_info
      if (nutrition.calories && nutrition.calories < 0) {
        errors.push('Calories cannot be negative')
      }
      if (nutrition.protein && nutrition.protein < 0) {
        errors.push('Protein cannot be negative')
      }
      if (nutrition.carbs && nutrition.carbs < 0) {
        errors.push('Carbs cannot be negative')
      }
      if (nutrition.fat && nutrition.fat < 0) {
        errors.push('Fat cannot be negative')
      }
    }

    // Preparation time validation
    if (menuItem.preparation_time && menuItem.preparation_time <= 0) {
      errors.push('Preparation time must be greater than 0')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Convert to mobile app format
  static toMobileFormat(menuItem: CompleteMenuItem): any {
    return {
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      description: menuItem.description,
      image: menuItem.image_url || 'assets/images/placeholder.png',
      cafeteriaId: menuItem.cafeteria_id,
      category: menuItem.category,
      rating: menuItem.rating || 0,
      isAvailable: menuItem.is_available,
      discount: 0.0,
      customizationOptions: menuItem.customization_options,
      nutritionInfo: menuItem.nutrition_info,
      ingredients: menuItem.ingredients
    }
  }

  // Convert from mobile app format
  static fromMobileFormat(mobileItem: any): CompleteMenuItem {
    return {
      id: mobileItem.id,
      cafeteria_id: mobileItem.cafeteriaId,
      name: mobileItem.name,
      description: mobileItem.description,
      price: mobileItem.price,
      category: mobileItem.category,
      image_url: mobileItem.image,
      is_available: mobileItem.isAvailable,
      nutrition_info: mobileItem.nutritionInfo,
      ingredients: mobileItem.ingredients,
      customization_options: mobileItem.customizationOptions,
      rating: mobileItem.rating,
      preparation_time: 15
    }
  }
}
