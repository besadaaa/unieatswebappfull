// Inventory Integration API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import {
  linkMenuItemToInventory,
  checkMenuItemAvailability,
  getStockAlerts,
  restockInventoryItem,
  getInventoryAnalytics
} from '@/lib/inventory-integration'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const cafeteriaId = searchParams.get('cafeteriaId')
    const menuItemId = searchParams.get('menuItemId')
    const timeRange = parseInt(searchParams.get('timeRange') || '30')
    
    if (action === 'check_availability' && menuItemId) {
      // Check menu item availability
      const availability = await checkMenuItemAvailability(menuItemId)
      
      return NextResponse.json({
        success: true,
        data: availability,
        menuItemId
      })
      
    } else if (action === 'stock_alerts' && cafeteriaId) {
      // Get stock alerts
      const alerts = await getStockAlerts(cafeteriaId)
      
      return NextResponse.json({
        success: true,
        data: alerts,
        cafeteriaId,
        alertCount: alerts.length
      })
      
    } else if (action === 'analytics' && cafeteriaId) {
      // Get inventory analytics
      const analytics = await getInventoryAnalytics(cafeteriaId, timeRange)
      
      return NextResponse.json({
        success: true,
        data: analytics,
        cafeteriaId,
        timeRange
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in inventory integration API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Link menu item to inventory or restock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'link_menu_item') {
      const { menuItemId, ingredients } = body
      
      if (!menuItemId || !ingredients || !Array.isArray(ingredients)) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      
      const success = await linkMenuItemToInventory(menuItemId, ingredients)
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to link menu item to inventory' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Menu item linked to inventory successfully'
      })
      
    } else if (action === 'restock') {
      const { inventoryItemId, quantity, costPerUnit, supplier } = body
      
      if (!inventoryItemId || !quantity) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      
      const success = await restockInventoryItem(
        inventoryItemId,
        quantity,
        costPerUnit,
        supplier
      )
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to restock inventory item' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Inventory item restocked successfully'
      })
      
    } else if (action === 'deduct_for_order') {
      const { orderItems } = body
      
      if (!orderItems || !Array.isArray(orderItems)) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      
      const { deductInventoryForOrder } = await import('@/lib/inventory-integration')
      const success = await deductInventoryForOrder(orderItems)
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to deduct inventory for order' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Inventory deducted for order successfully'
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in inventory integration API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update menu availability based on inventory
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cafeteriaId } = body
    
    if (action === 'update_availability' && cafeteriaId) {
      const { updateMenuItemAvailability } = await import('@/lib/inventory-integration')
      await updateMenuItemAvailability(cafeteriaId)
      
      return NextResponse.json({
        success: true,
        message: 'Menu item availability updated successfully'
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error updating menu availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
