import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const supabaseAdmin = createSupabaseAdmin()

    if (action === 'audit_all_calculations') {
      console.log('Starting comprehensive calculation audit...')

      // 1. Check all orders for consistent revenue calculations
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('id, subtotal, user_service_fee, cafeteria_commission, admin_revenue, total_amount')
        .not('admin_revenue', 'is', null)

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        return NextResponse.json({
          success: false,
          error: ordersError.message
        }, { status: 500 })
      }

      let inconsistentOrders = 0
      const issues = []

      // Audit each order for calculation consistency
      for (const order of orders || []) {
        const {
          subtotal,
          user_service_fee,
          cafeteria_commission,
          admin_revenue,
          total_amount
        } = order

        // Expected calculations
        const expectedServiceFee = Math.min(subtotal * 0.04, 20) // 4% capped at 20 EGP
        const expectedCommission = subtotal * 0.10 // 10%
        const expectedAdminRevenue = expectedServiceFee + expectedCommission
        const expectedTotalAmount = subtotal + expectedServiceFee

        // Check for inconsistencies (allow small floating point differences)
        const tolerance = 0.01

        if (Math.abs(user_service_fee - expectedServiceFee) > tolerance) {
          issues.push({
            orderId: order.id,
            field: 'user_service_fee',
            actual: user_service_fee,
            expected: expectedServiceFee,
            difference: user_service_fee - expectedServiceFee
          })
          inconsistentOrders++
        }

        if (Math.abs(cafeteria_commission - expectedCommission) > tolerance) {
          issues.push({
            orderId: order.id,
            field: 'cafeteria_commission',
            actual: cafeteria_commission,
            expected: expectedCommission,
            difference: cafeteria_commission - expectedCommission
          })
          inconsistentOrders++
        }

        if (Math.abs(admin_revenue - expectedAdminRevenue) > tolerance) {
          issues.push({
            orderId: order.id,
            field: 'admin_revenue',
            actual: admin_revenue,
            expected: expectedAdminRevenue,
            difference: admin_revenue - expectedAdminRevenue
          })
          inconsistentOrders++
        }

        if (Math.abs(total_amount - expectedTotalAmount) > tolerance) {
          issues.push({
            orderId: order.id,
            field: 'total_amount',
            actual: total_amount,
            expected: expectedTotalAmount,
            difference: total_amount - expectedTotalAmount
          })
          inconsistentOrders++
        }
      }

      return NextResponse.json({
        success: true,
        audit: {
          totalOrders: orders?.length || 0,
          inconsistentOrders,
          issuesFound: issues.length,
          issues: issues.slice(0, 10), // Return first 10 issues
          summary: {
            serviceFeeIssues: issues.filter(i => i.field === 'user_service_fee').length,
            commissionIssues: issues.filter(i => i.field === 'cafeteria_commission').length,
            adminRevenueIssues: issues.filter(i => i.field === 'admin_revenue').length,
            totalAmountIssues: issues.filter(i => i.field === 'total_amount').length
          }
        }
      })
    }

    if (action === 'fix_all_calculations') {
      console.log('Starting comprehensive calculation fix...')

      // Get all orders that need fixing
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
          id, 
          subtotal,
          user_service_fee,
          cafeteria_commission,
          admin_revenue,
          total_amount,
          order_items (
            item_id,
            quantity,
            price
          )
        `)

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        return NextResponse.json({
          success: false,
          error: ordersError.message
        }, { status: 500 })
      }

      let fixedCount = 0
      let errorCount = 0

      for (const order of orders || []) {
        try {
          // Calculate correct subtotal from order items
          const calculatedSubtotal = order.order_items?.reduce((sum: number, item: any) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity))
          }, 0) || 0

          // Use existing subtotal if order_items calculation fails
          const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (order.subtotal || 0)

          // Calculate correct fees
          const userServiceFee = Math.min(subtotal * 0.04, 20) // 4% capped at 20 EGP
          const cafeteriaCommission = subtotal * 0.10 // 10%
          const adminRevenue = userServiceFee + cafeteriaCommission
          const totalAmount = subtotal + userServiceFee

          // Update the order with correct calculations
          const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
              subtotal: parseFloat(subtotal.toFixed(2)),
              user_service_fee: parseFloat(userServiceFee.toFixed(2)),
              cafeteria_commission: parseFloat(cafeteriaCommission.toFixed(2)),
              admin_revenue: parseFloat(adminRevenue.toFixed(2)),
              total_amount: parseFloat(totalAmount.toFixed(2)),
              service_fee_percentage: 4,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          if (updateError) {
            console.error(`Error updating order ${order.id}:`, updateError)
            errorCount++
          } else {
            fixedCount++
          }

        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error)
          errorCount++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Fixed calculations for ${fixedCount} orders`,
        details: {
          totalOrders: orders?.length || 0,
          fixedCount,
          errorCount
        }
      })
    }

    if (action === 'validate_api_consistency') {
      console.log('Validating API calculation consistency...')

      // Test the dashboard API calculation
      const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard?timeRange=This+Year`)
      const dashboardData = await dashboardResponse.json()

      // Get raw order data for comparison
      const { data: rawOrders, error } = await supabaseAdmin
        .from('orders')
        .select('admin_revenue, user_service_fee, cafeteria_commission')
        .not('admin_revenue', 'is', null)

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      // Calculate expected totals
      const expectedTotalRevenue = rawOrders?.reduce((sum, order) => {
        return sum + (parseFloat(order.admin_revenue) || 0)
      }, 0) || 0

      const expectedServiceFees = rawOrders?.reduce((sum, order) => {
        return sum + (parseFloat(order.user_service_fee) || 0)
      }, 0) || 0

      const expectedCommissions = rawOrders?.reduce((sum, order) => {
        return sum + (parseFloat(order.cafeteria_commission) || 0)
      }, 0) || 0

      // Compare with dashboard API results
      const dashboardRevenue = dashboardData.metrics?.totalRevenue || 0
      const dashboardServiceFees = dashboardData.metrics?.userServiceFees || 0
      const dashboardCommissions = dashboardData.metrics?.cafeteriaCommissions || 0

      const tolerance = 0.01
      const revenueMatch = Math.abs(dashboardRevenue - expectedTotalRevenue) < tolerance
      const serviceFeesMatch = Math.abs(dashboardServiceFees - expectedServiceFees) < tolerance
      const commissionsMatch = Math.abs(dashboardCommissions - expectedCommissions) < tolerance

      return NextResponse.json({
        success: true,
        validation: {
          revenueCalculation: {
            expected: expectedTotalRevenue,
            dashboard: dashboardRevenue,
            match: revenueMatch,
            difference: dashboardRevenue - expectedTotalRevenue
          },
          serviceFees: {
            expected: expectedServiceFees,
            dashboard: dashboardServiceFees,
            match: serviceFeesMatch,
            difference: dashboardServiceFees - expectedServiceFees
          },
          commissions: {
            expected: expectedCommissions,
            dashboard: dashboardCommissions,
            match: commissionsMatch,
            difference: dashboardCommissions - expectedCommissions
          },
          allCalculationsCorrect: revenueMatch && serviceFeesMatch && commissionsMatch
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: audit_all_calculations, fix_all_calculations, or validate_api_consistency'
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in calculation fix API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Comprehensive Calculation Fix API',
    actions: [
      'POST with action: "audit_all_calculations" - Audit all orders for calculation consistency',
      'POST with action: "fix_all_calculations" - Fix all incorrect calculations in orders',
      'POST with action: "validate_api_consistency" - Validate that APIs return consistent calculations'
    ],
    revenueModel: {
      serviceFee: '4% of subtotal (capped at 20 EGP)',
      commission: '10% of subtotal',
      adminRevenue: 'Service fee + Commission (NO DOUBLING)',
      totalAmount: 'Subtotal + Service fee'
    },
    note: 'This API ensures NO DOUBLING occurs anywhere in the calculation chain'
  })
}
