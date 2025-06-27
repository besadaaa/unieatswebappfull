import { supabase } from './supabase'
import { InventoryManagementService } from './inventory-management-service'

export interface OrderProcessingResult {
  success: boolean
  orderId: string
  inventoryDeductions: any[]
  unavailableMenuItems: any[]
  error?: string
}

export class OrderProcessingService {
  
  /**
   * Process order status change and handle inventory deductions
   */
  static async processOrderStatusChange(orderId: string, newStatus: string, oldStatus?: string): Promise<OrderProcessingResult> {
    try {
      console.log(`🔄 [ORDER] Processing status change for order ${orderId}: ${oldStatus} → ${newStatus}`)

      // Only process inventory deductions when order is completed
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        console.log('✅ [ORDER] Order completed - processing inventory deductions')
        
        const result = await InventoryManagementService.processCompletedOrder(orderId)
        
        if (result.success) {
          // Log the inventory changes
          await this.logInventoryChanges(orderId, result.deductions)
          
          // Notify about unavailable menu items
          if (result.unavailableMenuItems.length > 0) {
            await this.notifyUnavailableMenuItems(result.unavailableMenuItems)
          }
        }

        return {
          success: result.success,
          orderId,
          inventoryDeductions: result.deductions,
          unavailableMenuItems: result.unavailableMenuItems,
          error: result.error
        }
      }

      // For other status changes, just return success
      return {
        success: true,
        orderId,
        inventoryDeductions: [],
        unavailableMenuItems: []
      }

    } catch (error) {
      console.error('❌ [ORDER] Error processing order status change:', error)
      return {
        success: false,
        orderId,
        inventoryDeductions: [],
        unavailableMenuItems: [],
        error: error.message
      }
    }
  }

  /**
   * Update order status and process inventory changes
   */
  static async updateOrderStatus(orderId: string, newStatus: string): Promise<OrderProcessingResult> {
    try {
      console.log(`🔄 [ORDER] Updating order ${orderId} status to: ${newStatus}`)

      // Get current order status
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (fetchError) {
        console.error('❌ [ORDER] Error fetching current order:', fetchError)
        throw fetchError
      }

      const oldStatus = currentOrder?.status

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('❌ [ORDER] Error updating order status:', updateError)
        throw updateError
      }

      console.log('✅ [ORDER] Order status updated successfully')

      // Process the status change
      return await this.processOrderStatusChange(orderId, newStatus, oldStatus)

    } catch (error) {
      console.error('❌ [ORDER] Error updating order status:', error)
      return {
        success: false,
        orderId,
        inventoryDeductions: [],
        unavailableMenuItems: [],
        error: error.message
      }
    }
  }

  /**
   * Check if order can be fulfilled with current inventory
   */
  static async checkOrderFulfillment(orderId: string): Promise<{
    canFulfill: boolean
    impactReport: any[]
    missingItems: string[]
  }> {
    try {
      console.log(`🔍 [ORDER] Checking fulfillment for order: ${orderId}`)

      // Get order items
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select('menu_item_id, quantity')
        .eq('order_id', orderId)

      if (orderError || !orderItems) {
        console.error('❌ [ORDER] Error fetching order items:', orderError)
        return { canFulfill: false, impactReport: [], missingItems: [] }
      }

      // Get inventory impact report
      const result = await InventoryManagementService.getInventoryImpactReport(orderItems)

      const missingItems = result.impactReport
        .filter(item => !item.sufficient)
        .map(item => `${item.inventoryItemName} (need ${item.requiredQuantity}, have ${item.currentQuantity} ${item.unit})`)

      console.log(`📊 [ORDER] Fulfillment check completed. Can fulfill: ${result.canFulfill}`)

      return {
        canFulfill: result.canFulfill,
        impactReport: result.impactReport,
        missingItems
      }

    } catch (error) {
      console.error('❌ [ORDER] Error checking order fulfillment:', error)
      return { canFulfill: false, impactReport: [], missingItems: [] }
    }
  }

  /**
   * Log inventory changes for audit trail
   */
  private static async logInventoryChanges(orderId: string, deductions: any[]): Promise<void> {
    try {
      console.log(`📝 [ORDER] Logging inventory changes for order: ${orderId}`)

      // Create inventory change log entries
      const logEntries = deductions.map(deduction => ({
        order_id: orderId,
        inventory_item_id: deduction.inventoryItemId,
        change_type: 'deduction',
        quantity_changed: -deduction.quantityUsed,
        reason: `Order completion - ${deduction.inventoryItemName}`,
        created_at: new Date().toISOString()
      }))

      if (logEntries.length > 0) {
        // Note: This assumes an inventory_changes table exists
        // If it doesn't exist, we can create it or just log to console
        console.log('📊 [ORDER] Inventory changes logged:', logEntries.length)
        
        // For now, just log to console since we don't have inventory_changes table
        logEntries.forEach(entry => {
          console.log(`📝 [INVENTORY LOG] ${entry.reason}: ${entry.quantity_changed} units`)
        })
      }

    } catch (error) {
      console.error('❌ [ORDER] Error logging inventory changes:', error)
    }
  }

  /**
   * Notify about unavailable menu items
   */
  private static async notifyUnavailableMenuItems(unavailableItems: any[]): Promise<void> {
    try {
      console.log(`⚠️ [ORDER] Notifying about unavailable menu items: ${unavailableItems.length}`)

      unavailableItems.forEach(item => {
        console.log(`⚠️ [MENU] ${item.menuItemName} is now unavailable due to insufficient ingredients:`)
        item.missingIngredients.forEach((missing: any) => {
          console.log(`   - ${missing.name}: need ${missing.required}, have ${missing.available} ${missing.unit}`)
        })
      })

      // Here you could implement additional notifications:
      // - Send email to cafeteria staff
      // - Create system notifications
      // - Update dashboard alerts
      // - Send push notifications

    } catch (error) {
      console.error('❌ [ORDER] Error notifying about unavailable menu items:', error)
    }
  }

  /**
   * Simulate order completion for testing
   */
  static async simulateOrderCompletion(orderId: string): Promise<OrderProcessingResult> {
    console.log(`🧪 [ORDER] Simulating order completion for: ${orderId}`)
    return await this.updateOrderStatus(orderId, 'completed')
  }

  /**
   * Get order processing summary
   */
  static async getOrderProcessingSummary(orderId: string): Promise<{
    order: any
    items: any[]
    inventoryImpact: any[]
    canFulfill: boolean
  }> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Get order items with menu item details
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_items (
            id,
            name,
            description
          )
        `)
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      // Get inventory impact
      const fulfillmentCheck = await this.checkOrderFulfillment(orderId)

      return {
        order,
        items: items || [],
        inventoryImpact: fulfillmentCheck.impactReport,
        canFulfill: fulfillmentCheck.canFulfill
      }

    } catch (error) {
      console.error('❌ [ORDER] Error getting order processing summary:', error)
      return {
        order: null,
        items: [],
        inventoryImpact: [],
        canFulfill: false
      }
    }
  }
}
