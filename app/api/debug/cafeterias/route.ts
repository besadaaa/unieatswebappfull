import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking cafeterias and orders...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get all cafeterias
    const { data: cafeterias, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, owner_id')
      .order('name')

    if (cafeteriaError) {
      console.error('Error fetching cafeterias:', cafeteriaError)
      return NextResponse.json({ error: 'Failed to fetch cafeterias' }, { status: 500 })
    }

    // Get orders count by cafeteria
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('cafeteria_id, total_amount, status, created_at')

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Group orders by cafeteria
    const ordersByCafeteria = orders?.reduce((acc: any, order: any) => {
      const cafeteriaId = order.cafeteria_id
      if (!acc[cafeteriaId]) {
        acc[cafeteriaId] = {
          count: 0,
          totalRevenue: 0,
          orders: []
        }
      }
      acc[cafeteriaId].count++
      acc[cafeteriaId].totalRevenue += parseFloat(order.total_amount || 0)
      acc[cafeteriaId].orders.push(order)
      return acc
    }, {}) || {}

    // Combine data
    const result = cafeterias?.map(cafeteria => ({
      id: cafeteria.id,
      name: cafeteria.name,
      owner_id: cafeteria.owner_id,
      orderCount: ordersByCafeteria[cafeteria.id]?.count || 0,
      totalRevenue: ordersByCafeteria[cafeteria.id]?.totalRevenue || 0,
      orders: ordersByCafeteria[cafeteria.id]?.orders || []
    })) || []

    console.log('✅ Debug results:', result)

    return NextResponse.json({
      success: true,
      cafeterias: result,
      totalOrders: orders?.length || 0,
      summary: {
        totalCafeterias: cafeterias?.length || 0,
        cafeteriasWithOrders: result.filter(c => c.orderCount > 0).length,
        totalRevenue: result.reduce((sum, c) => sum + c.totalRevenue, 0)
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
