import { supabase } from './supabase'
import { OrderProcessingService } from './order-processing-service'
import { InventoryManagementService } from './inventory-management-service'

export class InventoryTestingUtils {
  
  /**
   * Create a test order with specific menu items for testing inventory deduction
   */
  static async createTestOrder(cafeteriaId: string, menuItems: { menuItemId: string, quantity: number }[]): Promise<string | null> {
    try {
      console.log('🧪 [TEST] Creating test order with menu items:', menuItems)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          cafeteria_id: cafeteriaId,
          student_id: '00000000-0000-0000-0000-000000000001', // Test student ID
          status: 'pending',
          payment_status: 'paid',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('❌ [TEST] Error creating test order:', orderError)
        return null
      }

      console.log('✅ [TEST] Test order created:', order.id)

      // Add order items
      const orderItems = menuItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: 10.00 // Test price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('❌ [TEST] Error creating order items:', itemsError)
        return null
      }

      console.log('✅ [TEST] Order items created:', orderItems.length)
      return order.id

    } catch (error) {
      console.error('❌ [TEST] Error creating test order:', error)
      return null
    }
  }

  /**
   * Test the complete inventory deduction flow
   */
  static async testInventoryDeductionFlow(cafeteriaId: string, menuItemId: string, orderQuantity: number = 1): Promise<{
    success: boolean
    beforeInventory: any[]
    afterInventory: any[]
    deductions: any[]
    unavailableMenuItems: any[]
    orderId?: string
  }> {
    try {
      console.log('🧪 [TEST] Starting inventory deduction flow test')
      console.log(`📋 [TEST] Menu Item: ${menuItemId}, Quantity: ${orderQuantity}`)

      // Get inventory before
      const beforeInventory = await this.getInventorySnapshot(cafeteriaId)
      console.log('📊 [TEST] Inventory before:', beforeInventory.length, 'items')

      // Create test order
      const orderId = await this.createTestOrder(cafeteriaId, [{ menuItemId, quantity: orderQuantity }])
      if (!orderId) {
        throw new Error('Failed to create test order')
      }

      // Complete the order (this should trigger inventory deduction)
      const result = await OrderProcessingService.updateOrderStatus(orderId, 'completed')

      // Get inventory after
      const afterInventory = await this.getInventorySnapshot(cafeteriaId)
      console.log('📊 [TEST] Inventory after:', afterInventory.length, 'items')

      // Compare inventories
      const changes = this.compareInventorySnapshots(beforeInventory, afterInventory)
      console.log('📊 [TEST] Inventory changes detected:', changes.length)

      return {
        success: result.success,
        beforeInventory,
        afterInventory,
        deductions: result.inventoryDeductions,
        unavailableMenuItems: result.unavailableMenuItems,
        orderId
      }

    } catch (error) {
      console.error('❌ [TEST] Error in inventory deduction flow test:', error)
      return {
        success: false,
        beforeInventory: [],
        afterInventory: [],
        deductions: [],
        unavailableMenuItems: []
      }
    }
  }

  /**
   * Get current inventory snapshot
   */
  static async getInventorySnapshot(cafeteriaId: string): Promise<any[]> {
    try {
      const { data: inventory, error } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, unit, status, min_quantity')
        .eq('cafeteria_id', cafeteriaId)
        .order('name')

      if (error) {
        console.error('❌ [TEST] Error getting inventory snapshot:', error)
        return []
      }

      return inventory || []

    } catch (error) {
      console.error('❌ [TEST] Error getting inventory snapshot:', error)
      return []
    }
  }

  /**
   * Compare two inventory snapshots
   */
  static compareInventorySnapshots(before: any[], after: any[]): any[] {
    const changes: any[] = []

    before.forEach(beforeItem => {
      const afterItem = after.find(item => item.id === beforeItem.id)
      if (afterItem && afterItem.quantity !== beforeItem.quantity) {
        changes.push({
          id: beforeItem.id,
          name: beforeItem.name,
          quantityBefore: beforeItem.quantity,
          quantityAfter: afterItem.quantity,
          change: afterItem.quantity - beforeItem.quantity,
          unit: beforeItem.unit
        })
      }
    })

    return changes
  }

  /**
   * Test menu item availability checking
   */
  static async testMenuItemAvailability(cafeteriaId: string): Promise<{
    availableItems: any[]
    unavailableItems: any[]
    totalItems: number
  }> {
    try {
      console.log('🧪 [TEST] Testing menu item availability for cafeteria:', cafeteriaId)

      const unavailableItems = await InventoryManagementService.checkAndUpdateMenuItemAvailability(cafeteriaId)

      // Get all menu items to see the full picture
      const { data: allMenuItems, error } = await supabase
        .from('menu_items')
        .select('id, name, is_available')
        .eq('cafeteria_id', cafeteriaId)

      if (error) {
        console.error('❌ [TEST] Error getting menu items:', error)
        return { availableItems: [], unavailableItems: [], totalItems: 0 }
      }

      const availableItems = (allMenuItems || []).filter(item => item.is_available)

      console.log(`📊 [TEST] Menu items: ${allMenuItems?.length || 0} total, ${availableItems.length} available, ${unavailableItems.length} unavailable`)

      return {
        availableItems,
        unavailableItems,
        totalItems: allMenuItems?.length || 0
      }

    } catch (error) {
      console.error('❌ [TEST] Error testing menu item availability:', error)
      return { availableItems: [], unavailableItems: [], totalItems: 0 }
    }
  }

  /**
   * Generate test report
   */
  static async generateTestReport(cafeteriaId: string): Promise<{
    inventory: any[]
    menuItems: any[]
    recentOrders: any[]
    availabilityCheck: any
  }> {
    try {
      console.log('📊 [TEST] Generating comprehensive test report')

      // Get current inventory
      const inventory = await this.getInventorySnapshot(cafeteriaId)

      // Get menu items with ingredients
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          is_available,
          menu_item_ingredients (
            quantity_needed,
            unit,
            inventory_items (
              name,
              quantity,
              unit
            )
          )
        `)
        .eq('cafeteria_id', cafeteriaId)

      // Get recent orders
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          created_at,
          order_items (
            quantity,
            menu_items (
              name
            )
          )
        `)
        .eq('cafeteria_id', cafeteriaId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Check availability
      const availabilityCheck = await this.testMenuItemAvailability(cafeteriaId)

      return {
        inventory,
        menuItems: menuItems || [],
        recentOrders: recentOrders || [],
        availabilityCheck
      }

    } catch (error) {
      console.error('❌ [TEST] Error generating test report:', error)
      return {
        inventory: [],
        menuItems: [],
        recentOrders: [],
        availabilityCheck: { availableItems: [], unavailableItems: [], totalItems: 0 }
      }
    }
  }

  /**
   * Reset test data (use with caution!)
   */
  static async resetTestData(cafeteriaId: string): Promise<boolean> {
    try {
      console.log('🔄 [TEST] Resetting test data for cafeteria:', cafeteriaId)

      // Delete test orders (orders with test student ID)
      await supabase
        .from('orders')
        .delete()
        .eq('cafeteria_id', cafeteriaId)
        .eq('student_id', '00000000-0000-0000-0000-000000000001')

      // Reset menu items to available
      await supabase
        .from('menu_items')
        .update({ is_available: true })
        .eq('cafeteria_id', cafeteriaId)

      console.log('✅ [TEST] Test data reset completed')
      return true

    } catch (error) {
      console.error('❌ [TEST] Error resetting test data:', error)
      return false
    }
  }
}
