// Order Automation API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { processNewOrder, updateOrderStatus, autoProcessOrders, getOrderProcessingAnalytics } from '@/lib/order-automation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const cafeteriaId = searchParams.get('cafeteriaId')
    const timeRange = parseInt(searchParams.get('timeRange') || '30')
    
    if (action === 'analytics') {
      // Get order processing analytics
      const analytics = await getOrderProcessingAnalytics(cafeteriaId || undefined, timeRange)
      
      if (!analytics) {
        return NextResponse.json({ error: 'Failed to fetch order processing analytics' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        data: analytics,
        cafeteriaId: cafeteriaId || 'all',
        timeRange
      })
      
    } else if (action === 'auto_process') {
      // Trigger auto-processing of orders
      await autoProcessOrders()
      
      return NextResponse.json({
        success: true,
        message: 'Auto-processing completed'
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in order automation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'process_order') {
      const { orderData } = body
      
      if (!orderData) {
        return NextResponse.json({ error: 'Missing order data' }, { status: 400 })
      }
      
      // Validate required fields
      const requiredFields = ['user_id', 'cafeteria_id', 'order_items', 'total_amount']
      for (const field of requiredFields) {
        if (!orderData[field]) {
          return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
        }
      }
      
      const result = await processNewOrder(orderData)
      
      if (!result.success) {
        return NextResponse.json({ 
          error: result.message,
          details: result.errors 
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Order processed successfully'
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error processing new order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, newStatus, userId } = body
    
    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate status
    const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    const success = await updateOrderStatus(orderId, newStatus, userId)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
