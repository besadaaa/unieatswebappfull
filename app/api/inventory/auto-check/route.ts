// Automatic Inventory Checking API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { AutoInventoryManager } from '@/lib/auto-inventory-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const cafeteriaId = searchParams.get('cafeteriaId')
    const menuItemId = searchParams.get('menuItemId')
    
    switch (action) {
      case 'check_availability':
        if (!menuItemId) {
          return NextResponse.json({
            success: false,
            error: 'Menu item ID is required'
          }, { status: 400 })
        }
        
        const availability = await AutoInventoryManager.checkMenuItemAvailability(menuItemId)
        
        return NextResponse.json({
          success: true,
          data: availability,
          menuItemId
        })
        
      case 'get_alerts':
        if (!cafeteriaId) {
          return NextResponse.json({
            success: false,
            error: 'Cafeteria ID is required'
          }, { status: 400 })
        }
        
        const alerts = await AutoInventoryManager.getInventoryAlerts(cafeteriaId)
        
        return NextResponse.json({
          success: true,
          data: alerts,
          alertCount: alerts.length
        })
        
      case 'update_all_availability':
        if (!cafeteriaId) {
          return NextResponse.json({
            success: false,
            error: 'Cafeteria ID is required'
          }, { status: 400 })
        }
        
        const updateResult = await AutoInventoryManager.updateAllMenuItemsAvailability(cafeteriaId)
        
        return NextResponse.json({
          success: updateResult.success,
          data: updateResult,
          message: `Updated ${updateResult.updated} menu items`
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: check_availability, get_alerts, update_all_availability'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in auto inventory check API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    switch (action) {
      case 'link_ingredients':
        const { menuItemId, ingredients } = data
        
        if (!menuItemId || !ingredients) {
          return NextResponse.json({
            success: false,
            error: 'Menu item ID and ingredients are required'
          }, { status: 400 })
        }
        
        const linkResult = await AutoInventoryManager.linkMenuItemToInventory(menuItemId, ingredients)
        
        return NextResponse.json({
          success: linkResult.success,
          message: linkResult.message
        })
        
      case 'deduct_for_order':
        const { orderId } = data
        
        if (!orderId) {
          return NextResponse.json({
            success: false,
            error: 'Order ID is required'
          }, { status: 400 })
        }
        
        const deductResult = await AutoInventoryManager.deductInventoryForOrder(orderId)
        
        return NextResponse.json({
          success: deductResult.success,
          message: deductResult.message,
          affectedItems: deductResult.affectedItems
        })
        
      case 'restock_item':
        const { inventoryItemId, quantity, notes } = data
        
        if (!inventoryItemId || !quantity) {
          return NextResponse.json({
            success: false,
            error: 'Inventory item ID and quantity are required'
          }, { status: 400 })
        }
        
        const restockResult = await AutoInventoryManager.restockInventoryItem(
          inventoryItemId,
          quantity,
          notes
        )
        
        return NextResponse.json({
          success: restockResult.success,
          message: restockResult.message
        })
        
      case 'resolve_alert':
        const { alertId } = data
        
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'Alert ID is required'
          }, { status: 400 })
        }
        
        const resolveResult = await AutoInventoryManager.resolveAlert(alertId)
        
        return NextResponse.json({
          success: resolveResult,
          message: resolveResult ? 'Alert resolved successfully' : 'Failed to resolve alert'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: link_ingredients, deduct_for_order, restock_item, resolve_alert'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in auto inventory management API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { menuItemId, cafeteriaId } = body
    
    if (menuItemId) {
      // Update specific menu item availability
      const success = await AutoInventoryManager.updateMenuItemAvailability(menuItemId)
      
      return NextResponse.json({
        success,
        message: success ? 'Menu item availability updated' : 'Failed to update menu item availability'
      })
    } else if (cafeteriaId) {
      // Update all menu items for cafeteria
      const result = await AutoInventoryManager.updateAllMenuItemsAvailability(cafeteriaId)
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: `Updated ${result.updated} menu items`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either menuItemId or cafeteriaId is required'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
