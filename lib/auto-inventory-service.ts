// Enhanced Automatic Inventory Management Service
import { supabase } from './supabase'

export interface InventoryItem {
  id: string
  cafeteria_id: string
  name: string
  category: string
  quantity: number
  unit: string
  min_quantity: number
  max_quantity?: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  cost_per_unit?: number
  supplier?: string
  expiry_date?: string
  last_restocked?: string
  created_at: string
  updated_at: string
}

export interface MenuItemIngredient {
  id: string
  menu_item_id: string
  inventory_item_id: string
  quantity_needed: number
  unit: string
  is_optional: boolean
  created_at: string
  updated_at: string
}

export interface InventoryAlert {
  id: string
  cafeteria_id: string
  inventory_item_id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'expired' | 'expiring_soon'
  message: string
  is_resolved: boolean
  resolved_at?: string
  created_at: string
  inventory_item?: InventoryItem
}

// Enhanced Automatic Inventory Management Class
export class AutoInventoryManager {
  // Link menu item to inventory ingredients with automatic checking
  static async linkMenuItemToInventory(
    menuItemId: string,
    ingredients: { inventoryItemId: string; quantityNeeded: number; unit: string; isOptional?: boolean }[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      // First, remove existing links
      const { error: deleteError } = await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', menuItemId)
      
      if (deleteError) throw deleteError
      
      // Add new links
      const ingredientLinks = ingredients.map(ingredient => ({
        menu_item_id: menuItemId,
        inventory_item_id: ingredient.inventoryItemId,
        quantity_needed: ingredient.quantityNeeded,
        unit: ingredient.unit,
        is_optional: ingredient.isOptional || false
      }))
      
      const { error } = await supabase
        .from('menu_item_ingredients')
        .insert(ingredientLinks)
      
      if (error) throw error
      
      // Automatically check and update menu item availability
      await this.updateMenuItemAvailability(menuItemId)
      
      return { success: true, message: `Successfully linked ${ingredients.length} ingredients to menu item` }
    } catch (error) {
      console.error('Error linking menu item to inventory:', error)
      return { success: false, message: 'Failed to link ingredients to menu item' }
    }
  }

  // Automatically check menu item availability based on inventory
  static async checkMenuItemAvailability(menuItemId: string): Promise<{
    available: boolean
    missingIngredients: string[]
    lowStockIngredients: string[]
    details: { ingredient: string; needed: number; available: number; unit: string }[]
  }> {
    try {
      const { data: ingredients, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          *,
          inventory_items(*)
        `)
        .eq('menu_item_id', menuItemId)

      if (error) throw error

      const missingIngredients: string[] = []
      const lowStockIngredients: string[] = []
      const details: { ingredient: string; needed: number; available: number; unit: string }[] = []
      let available = true

      for (const ingredient of ingredients || []) {
        const inventoryItem = ingredient.inventory_items
        const needed = ingredient.quantity_needed
        const availableQty = inventoryItem.quantity

        details.push({
          ingredient: inventoryItem.name,
          needed,
          available: availableQty,
          unit: ingredient.unit
        })

        // Check if required ingredient is available
        if (!ingredient.is_optional) {
          if (inventoryItem.status === 'out_of_stock' || availableQty < needed) {
            available = false
            missingIngredients.push(inventoryItem.name)
          } else if (inventoryItem.status === 'low_stock') {
            lowStockIngredients.push(inventoryItem.name)
          }
        }
      }

      return {
        available,
        missingIngredients,
        lowStockIngredients,
        details
      }
    } catch (error) {
      console.error('Error checking menu item availability:', error)
      return {
        available: false,
        missingIngredients: [],
        lowStockIngredients: [],
        details: []
      }
    }
  }

  // Update menu item availability automatically
  static async updateMenuItemAvailability(menuItemId: string): Promise<boolean> {
    try {
      const availability = await this.checkMenuItemAvailability(menuItemId)
      
      const { error } = await supabase
        .from('menu_items')
        .update({
          is_available: availability.available,
          updated_at: new Date().toISOString()
        })
        .eq('id', menuItemId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error updating menu item availability:', error)
      return false
    }
  }

  // Update all menu items availability for a cafeteria
  static async updateAllMenuItemsAvailability(cafeteriaId: string): Promise<{
    success: boolean
    updated: number
    errors: string[]
  }> {
    try {
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('cafeteria_id', cafeteriaId)

      if (error) throw error

      let updated = 0
      const errors: string[] = []

      for (const menuItem of menuItems || []) {
        const success = await this.updateMenuItemAvailability(menuItem.id)
        if (success) {
          updated++
        } else {
          errors.push(`Failed to update ${menuItem.name}`)
        }
      }

      return { success: true, updated, errors }
    } catch (error) {
      console.error('Error updating all menu items availability:', error)
      return { success: false, updated: 0, errors: ['Failed to update menu items'] }
    }
  }

  // Deduct inventory when order is placed
  static async deductInventoryForOrder(orderId: string): Promise<{
    success: boolean
    message: string
    affectedItems: string[]
  }> {
    try {
      // Get order items
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_items(
            id,
            name,
            menu_item_ingredients(
              *,
              inventory_items(*)
            )
          )
        `)
        .eq('order_id', orderId)

      if (orderError) throw orderError

      const affectedItems: string[] = []

      for (const orderItem of orderItems || []) {
        const menuItem = orderItem.menu_items
        const ingredients = menuItem.menu_item_ingredients || []

        for (const ingredient of ingredients) {
          const inventoryItem = ingredient.inventory_items
          const totalNeeded = ingredient.quantity_needed * orderItem.quantity

          // Update inventory quantity
          const newQuantity = Math.max(0, inventoryItem.quantity - totalNeeded)
          
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ quantity: newQuantity })
            .eq('id', inventoryItem.id)

          if (updateError) throw updateError

          affectedItems.push(`${inventoryItem.name}: -${totalNeeded} ${ingredient.unit}`)
        }
      }

      return {
        success: true,
        message: `Successfully deducted inventory for order ${orderId}`,
        affectedItems
      }
    } catch (error) {
      console.error('Error deducting inventory for order:', error)
      return {
        success: false,
        message: 'Failed to deduct inventory for order',
        affectedItems: []
      }
    }
  }

  // Get active inventory alerts
  static async getInventoryAlerts(cafeteriaId: string): Promise<InventoryAlert[]> {
    try {
      const { data: alerts, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          inventory_items(*)
        `)
        .eq('cafeteria_id', cafeteriaId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      return alerts || []
    } catch (error) {
      console.error('Error getting inventory alerts:', error)
      return []
    }
  }

  // Resolve inventory alert
  static async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error resolving alert:', error)
      return false
    }
  }

  // Restock inventory item
  static async restockInventoryItem(
    inventoryItemId: string,
    quantity: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current inventory item
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', inventoryItemId)
        .single()

      if (fetchError) throw fetchError

      const newQuantity = currentItem.quantity + quantity

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity: newQuantity,
          last_restocked: new Date().toISOString()
        })
        .eq('id', inventoryItemId)

      if (updateError) throw updateError

      return {
        success: true,
        message: `Successfully restocked ${currentItem.name} with ${quantity} ${currentItem.unit}`
      }
    } catch (error) {
      console.error('Error restocking inventory:', error)
      return {
        success: false,
        message: 'Failed to restock inventory item'
      }
    }
  }
}
