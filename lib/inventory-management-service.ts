import { supabase } from './supabase'
import { MenuItemIngredientsService } from './menu-item-ingredients-service'

export interface InventoryDeduction {
  inventoryItemId: string
  inventoryItemName: string
  quantityUsed: number
  unit: string
  remainingQuantity: number
  wasSuccessful: boolean
}

export interface MenuItemAvailability {
  menuItemId: string
  menuItemName: string
  isAvailable: boolean
  missingIngredients: {
    name: string
    required: number
    available: number
    unit: string
  }[]
}

export class InventoryManagementService {
  
  /**
   * Process completed order and deduct ingredients from inventory
   */
  static async processCompletedOrder(orderId: string): Promise<{
    success: boolean
    deductions: InventoryDeduction[]
    unavailableMenuItems: MenuItemAvailability[]
    error?: string
  }> {
    try {
      console.log('🍽️ [INVENTORY] Processing completed order:', orderId)

      // Get order items with menu item details
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          menu_item_id,
          quantity,
          menu_items (
            id,
            name,
            cafeteria_id
          )
        `)
        .eq('order_id', orderId)

      if (orderError) {
        console.error('❌ [INVENTORY] Error fetching order items:', orderError)
        throw orderError
      }

      if (!orderItems || orderItems.length === 0) {
        console.log('⚠️ [INVENTORY] No order items found for order:', orderId)
        return { success: true, deductions: [], unavailableMenuItems: [] }
      }

      console.log('📦 [INVENTORY] Order items found:', orderItems.length)

      const allDeductions: InventoryDeduction[] = []
      const cafeteriaId = orderItems[0].menu_items?.cafeteria_id

      // Process each menu item in the order
      for (const orderItem of orderItems) {
        if (!orderItem.menu_item_id || !orderItem.quantity) continue

        console.log(`🍽️ [INVENTORY] Processing menu item: ${orderItem.menu_items?.name} (qty: ${orderItem.quantity})`)

        // Get ingredients for this menu item
        const ingredients = await MenuItemIngredientsService.getMenuItemIngredients(orderItem.menu_item_id)
        
        console.log(`📋 [INVENTORY] Ingredients found: ${ingredients.length}`)

        // Deduct ingredients for each quantity ordered
        for (const ingredient of ingredients) {
          const totalQuantityNeeded = ingredient.quantity * orderItem.quantity
          
          console.log(`🔢 [INVENTORY] Deducting ${totalQuantityNeeded} ${ingredient.unit} of ${ingredient.name}`)

          const deduction = await this.deductInventoryItem(
            ingredient.inventoryItemId,
            totalQuantityNeeded
          )

          if (deduction) {
            allDeductions.push(deduction)
          }
        }
      }

      // Check menu item availability after deductions
      const unavailableMenuItems = cafeteriaId 
        ? await this.checkAndUpdateMenuItemAvailability(cafeteriaId)
        : []

      console.log('✅ [INVENTORY] Order processing completed')
      console.log(`📊 [INVENTORY] Total deductions: ${allDeductions.length}`)
      console.log(`⚠️ [INVENTORY] Unavailable menu items: ${unavailableMenuItems.length}`)

      return {
        success: true,
        deductions: allDeductions,
        unavailableMenuItems
      }

    } catch (error) {
      console.error('❌ [INVENTORY] Error processing completed order:', error)
      return {
        success: false,
        deductions: [],
        unavailableMenuItems: [],
        error: error.message
      }
    }
  }

  /**
   * Deduct quantity from a specific inventory item
   */
  static async deductInventoryItem(inventoryItemId: string, quantityToDeduct: number): Promise<InventoryDeduction | null> {
    try {
      console.log(`🔽 [INVENTORY] Deducting ${quantityToDeduct} from inventory item: ${inventoryItemId}`)

      // Get current inventory item
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, unit, min_quantity')
        .eq('id', inventoryItemId)
        .single()

      if (fetchError || !inventoryItem) {
        console.error('❌ [INVENTORY] Error fetching inventory item:', fetchError)
        return null
      }

      const currentQuantity = parseFloat(inventoryItem.quantity.toString())
      const newQuantity = Math.max(0, currentQuantity - quantityToDeduct)

      console.log(`📊 [INVENTORY] ${inventoryItem.name}: ${currentQuantity} → ${newQuantity} ${inventoryItem.unit}`)

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryItemId)

      if (updateError) {
        console.error('❌ [INVENTORY] Error updating inventory item:', updateError)
        return {
          inventoryItemId,
          inventoryItemName: inventoryItem.name,
          quantityUsed: quantityToDeduct,
          unit: inventoryItem.unit,
          remainingQuantity: currentQuantity,
          wasSuccessful: false
        }
      }

      // Check if item is now below minimum quantity
      if (newQuantity <= inventoryItem.min_quantity) {
        console.log(`⚠️ [INVENTORY] ${inventoryItem.name} is now below minimum quantity (${inventoryItem.min_quantity})`)
        
        // Update status to low_stock
        await supabase
          .from('inventory_items')
          .update({ status: 'low_stock' })
          .eq('id', inventoryItemId)
      }

      return {
        inventoryItemId,
        inventoryItemName: inventoryItem.name,
        quantityUsed: quantityToDeduct,
        unit: inventoryItem.unit,
        remainingQuantity: newQuantity,
        wasSuccessful: true
      }

    } catch (error) {
      console.error('❌ [INVENTORY] Error deducting inventory item:', error)
      return null
    }
  }

  /**
   * Check menu item availability and update status
   */
  static async checkAndUpdateMenuItemAvailability(cafeteriaId: string): Promise<MenuItemAvailability[]> {
    try {
      console.log('🔍 [INVENTORY] Checking menu item availability for cafeteria:', cafeteriaId)

      // Get all menu items for this cafeteria
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, is_available')
        .eq('cafeteria_id', cafeteriaId)

      if (menuError || !menuItems) {
        console.error('❌ [INVENTORY] Error fetching menu items:', menuError)
        return []
      }

      const availabilityResults: MenuItemAvailability[] = []

      for (const menuItem of menuItems) {
        const availability = await this.checkSingleMenuItemAvailability(menuItem.id, menuItem.name)
        availabilityResults.push(availability)

        // Update menu item availability if it changed
        if (availability.isAvailable !== menuItem.is_available) {
          console.log(`🔄 [INVENTORY] Updating ${menuItem.name} availability: ${menuItem.is_available} → ${availability.isAvailable}`)
          
          await supabase
            .from('menu_items')
            .update({ 
              is_available: availability.isAvailable,
              updated_at: new Date().toISOString()
            })
            .eq('id', menuItem.id)
        }
      }

      const unavailableItems = availabilityResults.filter(item => !item.isAvailable)
      console.log(`📊 [INVENTORY] Availability check completed. Unavailable items: ${unavailableItems.length}`)

      return unavailableItems

    } catch (error) {
      console.error('❌ [INVENTORY] Error checking menu item availability:', error)
      return []
    }
  }

  /**
   * Check if a single menu item can be made with current inventory
   */
  static async checkSingleMenuItemAvailability(menuItemId: string, menuItemName: string): Promise<MenuItemAvailability> {
    try {
      // Get ingredients for this menu item
      const ingredients = await MenuItemIngredientsService.getMenuItemIngredients(menuItemId)
      
      if (ingredients.length === 0) {
        // No ingredients required, item is available
        return {
          menuItemId,
          menuItemName,
          isAvailable: true,
          missingIngredients: []
        }
      }

      const missingIngredients: MenuItemAvailability['missingIngredients'] = []

      // Check each ingredient
      for (const ingredient of ingredients) {
        const { data: inventoryItem, error } = await supabase
          .from('inventory_items')
          .select('quantity, status')
          .eq('id', ingredient.inventoryItemId)
          .single()

        if (error || !inventoryItem) {
          // Ingredient not found in inventory
          missingIngredients.push({
            name: ingredient.name,
            required: ingredient.quantity,
            available: 0,
            unit: ingredient.unit
          })
          continue
        }

        const availableQuantity = parseFloat(inventoryItem.quantity.toString())
        
        // Check if there's enough quantity and item is in stock
        if (availableQuantity < ingredient.quantity || inventoryItem.status === 'out_of_stock') {
          missingIngredients.push({
            name: ingredient.name,
            required: ingredient.quantity,
            available: availableQuantity,
            unit: ingredient.unit
          })
        }
      }

      const isAvailable = missingIngredients.length === 0

      return {
        menuItemId,
        menuItemName,
        isAvailable,
        missingIngredients
      }

    } catch (error) {
      console.error('❌ [INVENTORY] Error checking single menu item availability:', error)
      return {
        menuItemId,
        menuItemName,
        isAvailable: false,
        missingIngredients: []
      }
    }
  }

  /**
   * Get inventory impact report for a potential order
   */
  static async getInventoryImpactReport(orderItems: { menuItemId: string, quantity: number }[]): Promise<{
    canFulfill: boolean
    impactReport: {
      inventoryItemName: string
      currentQuantity: number
      requiredQuantity: number
      remainingAfter: number
      unit: string
      sufficient: boolean
    }[]
  }> {
    try {
      console.log('📊 [INVENTORY] Generating inventory impact report')

      const impactMap = new Map<string, {
        inventoryItemId: string
        inventoryItemName: string
        currentQuantity: number
        requiredQuantity: number
        unit: string
      }>()

      // Calculate total requirements
      for (const orderItem of orderItems) {
        const ingredients = await MenuItemIngredientsService.getMenuItemIngredients(orderItem.menuItemId)
        
        for (const ingredient of ingredients) {
          const totalRequired = ingredient.quantity * orderItem.quantity
          const key = ingredient.inventoryItemId

          if (impactMap.has(key)) {
            const existing = impactMap.get(key)!
            existing.requiredQuantity += totalRequired
          } else {
            // Get current inventory quantity
            const { data: inventoryItem } = await supabase
              .from('inventory_items')
              .select('quantity')
              .eq('id', ingredient.inventoryItemId)
              .single()

            impactMap.set(key, {
              inventoryItemId: ingredient.inventoryItemId,
              inventoryItemName: ingredient.name,
              currentQuantity: inventoryItem ? parseFloat(inventoryItem.quantity.toString()) : 0,
              requiredQuantity: totalRequired,
              unit: ingredient.unit
            })
          }
        }
      }

      // Generate report
      const impactReport = Array.from(impactMap.values()).map(item => ({
        inventoryItemName: item.inventoryItemName,
        currentQuantity: item.currentQuantity,
        requiredQuantity: item.requiredQuantity,
        remainingAfter: item.currentQuantity - item.requiredQuantity,
        unit: item.unit,
        sufficient: item.currentQuantity >= item.requiredQuantity
      }))

      const canFulfill = impactReport.every(item => item.sufficient)

      console.log(`📊 [INVENTORY] Impact report generated. Can fulfill: ${canFulfill}`)

      return { canFulfill, impactReport }

    } catch (error) {
      console.error('❌ [INVENTORY] Error generating inventory impact report:', error)
      return { canFulfill: false, impactReport: [] }
    }
  }
}
