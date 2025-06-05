import { NextRequest, NextResponse } from 'next/server'
import { OrderRevenueService } from '@/lib/order-revenue-service'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'fix_all_orders') {
      console.log('Starting to fix revenue calculations for all orders...')
      
      const result = await OrderRevenueService.fixAllOrdersRevenue()
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully updated revenue calculations for ${result.updatedCount} orders`,
          details: {
            totalOrders: result.totalOrders,
            updatedCount: result.updatedCount,
            errorCount: result.errorCount
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 })
      }
    }

    if (action === 'fix_single_order') {
      const { orderId } = await request.json()
      
      if (!orderId) {
        return NextResponse.json({
          success: false,
          error: 'Order ID is required'
        }, { status: 400 })
      }

      console.log(`Fixing revenue calculation for order: ${orderId}`)
      
      const result = await OrderRevenueService.updateOrderRevenue(orderId)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully updated revenue calculation for order ${orderId}`,
          order: result.order,
          revenue: result.revenue
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 })
      }
    }

    if (action === 'get_revenue_summary') {
      const { startDate, endDate } = await request.json()
      
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined
      
      const result = await OrderRevenueService.getRevenueSummary(start, end)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          summary: result.summary
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: fix_all_orders, fix_single_order, or get_revenue_summary'
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in fix-order-revenue API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Order Revenue Fix API',
    actions: [
      'POST with action: "fix_all_orders" - Fix revenue calculations for all orders missing them',
      'POST with action: "fix_single_order" + orderId - Fix revenue calculation for a specific order',
      'POST with action: "get_revenue_summary" + optional startDate/endDate - Get revenue summary'
    ],
    revenueModel: {
      serviceFee: '4% of subtotal (capped at 20 EGP)',
      commission: '10% of subtotal',
      adminRevenue: 'Service fee + Commission',
      totalAmount: 'Subtotal + Service fee'
    }
  })
}
