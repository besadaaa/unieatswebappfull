// Real-time Analytics API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getCafeteriaAnalytics, getAdminAnalytics } from '@/lib/analytics'
import { getInventoryAnalytics } from '@/lib/inventory-integration'
import { getOrderProcessingAnalytics } from '@/lib/order-automation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'cafeteria' or 'admin'
    const cafeteriaId = searchParams.get('cafeteriaId')
    const timeRange = parseInt(searchParams.get('timeRange') || '30')
    const includeInventory = searchParams.get('includeInventory') === 'true'
    const includeOrders = searchParams.get('includeOrders') === 'true'
    
    if (type === 'cafeteria' && cafeteriaId) {
      // Get cafeteria analytics
      const analytics = await getCafeteriaAnalytics(cafeteriaId, timeRange)
      
      if (!analytics) {
        return NextResponse.json({ error: 'Failed to fetch cafeteria analytics' }, { status: 500 })
      }
      
      // Add inventory analytics if requested
      let inventoryData = null
      if (includeInventory) {
        inventoryData = await getInventoryAnalytics(cafeteriaId, timeRange)
      }
      
      // Add order processing analytics if requested
      let orderProcessingData = null
      if (includeOrders) {
        orderProcessingData = await getOrderProcessingAnalytics(cafeteriaId, timeRange)
      }
      
      return NextResponse.json({
        success: true,
        type: 'cafeteria',
        data: {
          analytics,
          inventory: inventoryData,
          orderProcessing: orderProcessingData
        },
        cafeteriaId,
        timeRange,
        generatedAt: new Date().toISOString()
      })
      
    } else if (type === 'admin') {
      // Get admin analytics
      const analytics = await getAdminAnalytics(timeRange)
      
      if (!analytics) {
        return NextResponse.json({ error: 'Failed to fetch admin analytics' }, { status: 500 })
      }
      
      // Add system-wide order processing analytics
      let orderProcessingData = null
      if (includeOrders) {
        orderProcessingData = await getOrderProcessingAnalytics(undefined, timeRange)
      }
      
      return NextResponse.json({
        success: true,
        type: 'admin',
        data: {
          analytics,
          orderProcessing: orderProcessingData
        },
        timeRange,
        generatedAt: new Date().toISOString()
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in real-time analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update performance metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cafeteriaId, date } = body
    
    if (action === 'update_performance_metrics') {
      if (!cafeteriaId || !date) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      
      const { updateCafeteriaPerformanceMetrics } = await import('@/lib/analytics')
      const success = await updateCafeteriaPerformanceMetrics(cafeteriaId, date)
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to update performance metrics' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Performance metrics updated successfully'
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error updating performance metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
