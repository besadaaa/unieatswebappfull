import { supabase } from './supabase'

export interface MenuItemIngredient {
  id?: string
  menu_item_id: string
  inventory_item_id: string
  quantity_needed: number
  unit: string
  is_optional?: boolean
  created_at?: string
  updated_at?: string
}

export interface IngredientDetail {
  inventoryItemId: string
  name: string
  quantity: number
  unit: string
}

export class MenuItemIngredientsService {
  // Save ingredients for a menu item
  static async saveMenuItemIngredients(menuItemId: string, ingredients: IngredientDetail[]) {
    try {
      console.log('🍽️ [DEBUG] Saving menu item ingredients:', {
        menuItemId,
        ingredients,
        ingredientsCount: ingredients?.length || 0
      })

      // First, delete existing ingredients for this menu item
      console.log('🗑️ [DEBUG] Deleting existing ingredients for menu item:', menuItemId)
      const { error: deleteError } = await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', menuItemId)

      if (deleteError) {
        console.error('❌ [DEBUG] Error deleting existing ingredients:', deleteError)
        throw deleteError
      }
      console.log('✅ [DEBUG] Existing ingredients deleted successfully')

      // If no ingredients to save, return success
      if (!ingredients || ingredients.length === 0) {
        console.log('✅ [DEBUG] No ingredients to save')
        return { success: true, data: [] }
      }

      // Prepare ingredient records for insertion
      const ingredientRecords = ingredients.map(ingredient => ({
        menu_item_id: menuItemId,
        inventory_item_id: ingredient.inventoryItemId,
        quantity_needed: ingredient.quantity,
        unit: ingredient.unit,
        is_optional: false
      }))

      console.log('📝 [DEBUG] Inserting ingredient records:', ingredientRecords)

      // Insert new ingredients
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .insert(ingredientRecords)
        .select()

      if (error) {
        console.error('❌ [DEBUG] Error inserting ingredients:', error)
        console.error('❌ [DEBUG] Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('✅ [DEBUG] Menu item ingredients saved successfully:', data)
      return { success: true, data }

    } catch (error) {
      console.error('❌ [DEBUG] Error in saveMenuItemIngredients:', error)
      console.error('❌ [DEBUG] Error stack:', error.stack)
      throw error
    }
  }

  // Get ingredients for a menu item
  static async getMenuItemIngredients(menuItemId: string): Promise<IngredientDetail[]> {
    try {
      console.log('🔍 Fetching ingredients for menu item:', menuItemId)

      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          *,
          inventory_items (
            id,
            name,
            unit
          )
        `)
        .eq('menu_item_id', menuItemId)

      if (error) {
        console.error('❌ Error fetching menu item ingredients:', error)
        throw error
      }

      console.log('📦 Raw ingredient data:', data)

      // Transform to IngredientDetail format
      const ingredients: IngredientDetail[] = data?.map(item => ({
        inventoryItemId: item.inventory_item_id,
        name: item.inventory_items?.name || 'Unknown Item',
        quantity: parseFloat(item.quantity_needed.toString()),
        unit: item.unit
      })) || []

      console.log('✅ Transformed ingredients:', ingredients)
      return ingredients

    } catch (error) {
      console.error('❌ Error in getMenuItemIngredients:', error)
      return []
    }
  }

  // Update ingredients for a menu item
  static async updateMenuItemIngredients(menuItemId: string, ingredients: IngredientDetail[]) {
    try {
      console.log('🔄 Updating menu item ingredients:', { menuItemId, ingredients })
      
      // Use the same save method which handles delete + insert
      return await this.saveMenuItemIngredients(menuItemId, ingredients)
      
    } catch (error) {
      console.error('❌ Error in updateMenuItemIngredients:', error)
      throw error
    }
  }

  // Delete all ingredients for a menu item
  static async deleteMenuItemIngredients(menuItemId: string) {
    try {
      console.log('🗑️ Deleting ingredients for menu item:', menuItemId)

      const { error } = await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', menuItemId)

      if (error) {
        console.error('❌ Error deleting menu item ingredients:', error)
        throw error
      }

      console.log('✅ Menu item ingredients deleted successfully')
      return { success: true }

    } catch (error) {
      console.error('❌ Error in deleteMenuItemIngredients:', error)
      throw error
    }
  }
}
