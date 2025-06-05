// Enhanced Inventory-Menu Integration System with Automatic Checking
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

export interface InventoryTransaction {
  id: string
  inventory_item_id: string
  transaction_type: 'restock' | 'usage' | 'waste' | 'adjustment'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_by?: string
  created_at: string
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

export interface StockAlert {
  inventoryItem: InventoryItem
  menuItemsAffected: string[]
  severity: 'low' | 'critical' | 'out_of_stock'
}

// Link menu item to inventory ingredients
export const linkMenuItemToInventory = async (
  menuItemId: string,
  ingredients: { inventoryItemId: string; quantityNeeded: number; unit: string }[]
): Promise<boolean> => {
  try {
    // First, remove existing links
    await supabase
      .from('menu_item_ingredients')
      .delete()
      .eq('menu_item_id', menuItemId)
    
    // Add new links
    const ingredientLinks = ingredients.map(ingredient => ({
      menu_item_id: menuItemId,
      inventory_item_id: ingredient.inventoryItemId,
      quantity_needed: ingredient.quantityNeeded,
      unit: ingredient.unit
    }))
    
    const { error } = await supabase
      .from('menu_item_ingredients')
      .insert(ingredientLinks)
    
    if (error) throw error
    
    // Log the linking activity
    await logUserActivity(
      null, // Will be set by calling function
      'menu_inventory_linked',
      'menu_item',
      menuItemId,
      { ingredients: ingredients.length }
    )
    
    return true
  } catch (error) {
    console.error('Error linking menu item to inventory:', error)
    return false
  }
}

// Check if menu item can be prepared based on inventory
export const checkMenuItemAvailability = async (menuItemId: string): Promise<{
  available: boolean
  missingIngredients: string[]
  lowStockIngredients: string[]
}> => {
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
    let available = true
    
    for (const ingredient of ingredients || []) {
      const inventoryItem = ingredient.inventory_items
      if (!inventoryItem) continue
      
      if (inventoryItem.quantity < ingredient.quantity_needed) {
        missingIngredients.push(inventoryItem.name)
        available = false
      } else if (inventoryItem.quantity <= inventoryItem.min_quantity) {
        lowStockIngredients.push(inventoryItem.name)
      }
    }
    
    return {
      available,
      missingIngredients,
      lowStockIngredients
    }
  } catch (error) {
    console.error('Error checking menu item availability:', error)
    return {
      available: false,
      missingIngredients: [],
      lowStockIngredients: []
    }
  }
}

// Deduct inventory when order is placed
export const deductInventoryForOrder = async (orderItems: {
  menuItemId: string
  quantity: number
}[]): Promise<boolean> => {
  try {
    for (const orderItem of orderItems) {
      // Get ingredients needed for this menu item
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('menu_item_ingredients')
        .select(`
          *,
          inventory_items(*)
        `)
        .eq('menu_item_id', orderItem.menuItemId)
      
      if (ingredientsError) throw ingredientsError
      
      // Deduct each ingredient
      for (const ingredient of ingredients || []) {
        const totalNeeded = ingredient.quantity_needed * orderItem.quantity
        const newQuantity = ingredient.inventory_items.quantity - totalNeeded
        
        // Update inventory quantity
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            quantity: Math.max(0, newQuantity),
            status: newQuantity <= 0 ? 'out_of_stock' : 
                   newQuantity <= ingredient.inventory_items.min_quantity ? 'low_stock' : 'in_stock',
            updated_at: new Date().toISOString()
          })
          .eq('id', ingredient.inventory_item_id)
        
        if (updateError) throw updateError
        
        // Create alert if stock is low or out
        if (newQuantity <= ingredient.inventory_items.min_quantity) {
          await createStockAlert(ingredient.inventory_items, newQuantity <= 0 ? 'out_of_stock' : 'low_stock')
        }
      }
    }
    
    // Log inventory deduction
    await logUserActivity(
      null,
      'inventory_deducted',
      'order_processing',
      null,
      { orderItems: orderItems.length }
    )
    
    return true
  } catch (error) {
    console.error('Error deducting inventory for order:', error)
    return false
  }
}

// Create stock alert and notification
const createStockAlert = async (
  inventoryItem: InventoryItem,
  severity: 'low_stock' | 'out_of_stock'
): Promise<void> => {
  try {
    // Get cafeteria owner
    const { data: cafeteria } = await supabase
      .from('cafeterias')
      .select('owner_id, name')
      .eq('id', inventoryItem.cafeteria_id)
      .single()
    
    if (!cafeteria?.owner_id) return
    
    // Get affected menu items
    const { data: affectedItems } = await supabase
      .from('menu_item_ingredients')
      .select('menu_item_id')
      .eq('inventory_item_id', inventoryItem.id)

    // Get menu item names separately
    let menuItemNames: string[] = []
    if (affectedItems && affectedItems.length > 0) {
      const menuItemIds = affectedItems.map(item => item.menu_item_id).filter(Boolean)
      if (menuItemIds.length > 0) {
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('name')
          .in('id', menuItemIds)

        menuItemNames = menuItems?.map(item => item.name).filter(Boolean) || []
      }
    }
    
    const title = severity === 'out_of_stock' 
      ? `Out of Stock: ${inventoryItem.name}`
      : `Low Stock Alert: ${inventoryItem.name}`
    
    const message = severity === 'out_of_stock'
      ? `${inventoryItem.name} is out of stock. Affected menu items: ${menuItemNames.join(', ')}`
      : `${inventoryItem.name} is running low (${inventoryItem.quantity} ${inventoryItem.unit} remaining). Minimum: ${inventoryItem.min_quantity} ${inventoryItem.unit}`
    
    await createSystemNotification(
      cafeteria.owner_id,
      'alert',
      title,
      message,
      {
        inventoryItemId: inventoryItem.id,
        severity,
        affectedMenuItems: menuItemNames,
        currentStock: inventoryItem.quantity,
        minStock: inventoryItem.min_quantity
      },
      severity === 'out_of_stock' ? 'urgent' : 'high'
    )
  } catch (error) {
    console.error('Error creating stock alert:', error)
  }
}

// Get stock alerts for cafeteria
export const getStockAlerts = async (cafeteriaId: string): Promise<StockAlert[]> => {
  try {
    const { data: lowStockItems, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .or('status.eq.low_stock,status.eq.out_of_stock')

    if (error) throw error

    // Get menu item ingredients and names separately
    const alerts: StockAlert[] = []

    for (const item of lowStockItems || []) {
      // Get menu item ingredients for this inventory item
      const { data: ingredients } = await supabase
        .from('menu_item_ingredients')
        .select('menu_item_id')
        .eq('inventory_item_id', item.id)

      // Get menu item names
      let menuItemsAffected: string[] = []
      if (ingredients && ingredients.length > 0) {
        const menuItemIds = ingredients.map(ing => ing.menu_item_id).filter(Boolean)
        if (menuItemIds.length > 0) {
          const { data: menuItems } = await supabase
            .from('menu_items')
            .select('name')
            .in('id', menuItemIds)

          menuItemsAffected = menuItems?.map(mi => mi.name).filter(Boolean) || []
        }
      }

      alerts.push({
        inventoryItem: item,
        menuItemsAffected,
        severity: item.status === 'out_of_stock' ? 'out_of_stock' :
                 item.quantity === 0 ? 'critical' : 'low'
      })
    }
    
    return alerts
  } catch (error) {
    console.error('Error getting stock alerts:', error)
    return []
  }
}

// Update menu item availability based on inventory
export const updateMenuItemAvailability = async (cafeteriaId: string): Promise<void> => {
  try {
    // Get all menu items for the cafeteria
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('cafeteria_id', cafeteriaId)
    
    if (!menuItems) return
    
    // Check availability for each menu item
    for (const menuItem of menuItems) {
      const availability = await checkMenuItemAvailability(menuItem.id)
      
      // Update menu item availability
      await supabase
        .from('menu_items')
        .update({
          is_available: availability.available,
          updated_at: new Date().toISOString()
        })
        .eq('id', menuItem.id)
      
      // If item became unavailable, notify cafeteria owner
      if (!availability.available && availability.missingIngredients.length > 0) {
        const { data: cafeteria } = await supabase
          .from('cafeterias')
          .select('owner_id')
          .eq('id', cafeteriaId)
          .single()
        
        if (cafeteria?.owner_id) {
          await createSystemNotification(
            cafeteria.owner_id,
            'alert',
            `Menu Item Unavailable: ${menuItem.name}`,
            `${menuItem.name} is now unavailable due to missing ingredients: ${availability.missingIngredients.join(', ')}`,
            {
              menuItemId: menuItem.id,
              missingIngredients: availability.missingIngredients
            },
            'high'
          )
        }
      }
    }
  } catch (error) {
    console.error('Error updating menu item availability:', error)
  }
}

// Restock inventory item
export const restockInventoryItem = async (
  inventoryItemId: string,
  quantity: number,
  costPerUnit?: number,
  supplier?: string
): Promise<boolean> => {
  try {
    // Get current inventory item
    const { data: currentItem } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .single()
    
    if (!currentItem) return false
    
    const newQuantity = currentItem.quantity + quantity
    const newStatus = newQuantity <= 0 ? 'out_of_stock' : 
                     newQuantity <= currentItem.min_quantity ? 'low_stock' : 'in_stock'
    
    // Update inventory
    const { error } = await supabase
      .from('inventory_items')
      .update({
        quantity: newQuantity,
        status: newStatus,
        cost_per_unit: costPerUnit || currentItem.cost_per_unit,
        supplier: supplier || currentItem.supplier,
        last_restocked: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', inventoryItemId)
    
    if (error) throw error
    
    // Update menu item availability
    await updateMenuItemAvailability(currentItem.cafeteria_id)
    
    // Log restocking activity
    await logUserActivity(
      null,
      'inventory_restocked',
      'inventory_item',
      inventoryItemId,
      { quantity, newTotal: newQuantity, supplier }
    )
    
    return true
  } catch (error) {
    console.error('Error restocking inventory item:', error)
    return false
  }
}

// Get inventory usage analytics
export const getInventoryAnalytics = async (
  cafeteriaId: string,
  timeRange: number = 30
): Promise<{
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalValue: number
  topUsedItems: { name: string; used: number; remaining: number }[]
  restockingNeeded: { name: string; current: number; minimum: number; suggested: number }[]
}> => {
  try {
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
    
    if (!inventory) return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0,
      topUsedItems: [],
      restockingNeeded: []
    }
    
    const totalItems = inventory.length
    const lowStockItems = inventory.filter(item => item.status === 'low_stock').length
    const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length
    const totalValue = inventory.reduce((sum, item) => 
      sum + (item.quantity * (item.cost_per_unit || 0)), 0)
    
    // Calculate usage (would need historical data in production)
    const topUsedItems = inventory
      .filter(item => item.quantity < item.min_quantity * 2) // Items that have been used
      .map(item => ({
        name: item.name,
        used: Math.max(0, item.min_quantity * 3 - item.quantity), // Estimated usage
        remaining: item.quantity
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 10)
    
    // Items needing restocking
    const restockingNeeded = inventory
      .filter(item => item.quantity <= item.min_quantity)
      .map(item => ({
        name: item.name,
        current: item.quantity,
        minimum: item.min_quantity,
        suggested: item.min_quantity * 3 // Suggest 3x minimum stock
      }))
    
    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      topUsedItems,
      restockingNeeded
    }
  } catch (error) {
    console.error('Error getting inventory analytics:', error)
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0,
      topUsedItems: [],
      restockingNeeded: []
    }
  }
}
