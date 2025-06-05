import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking orders and their cafeteria assignments...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get all orders with their cafeteria info
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        cafeteria_id,
        status,
        total_amount,
        created_at,
        platform,
        cafeterias!orders_cafeteria_id_fkey(
          id,
          name,
          owner_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Get all cafeterias
    const { data: cafeterias, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, owner_id')
      .order('name')

    if (cafeteriaError) {
      console.error('Error fetching cafeterias:', cafeteriaError)
      return NextResponse.json({ error: 'Failed to fetch cafeterias' }, { status: 500 })
    }

    // Get current user info (cafeteria manager)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', 'a9239cb0-7d3a-4ed7-a819-c5906444feb6') // Current cafeteria manager

    console.log('📊 Debug Results:')
    console.log('Total orders found:', orders?.length || 0)
    console.log('Total cafeterias found:', cafeterias?.length || 0)
    console.log('Current user profile:', profiles?.[0] || 'Not found')

    // Group orders by cafeteria
    const ordersByCafeteria = orders?.reduce((acc, order) => {
      const cafeteriaId = order.cafeteria_id || 'no-cafeteria'
      if (!acc[cafeteriaId]) {
        acc[cafeteriaId] = []
      }
      acc[cafeteriaId].push(order)
      return acc
    }, {} as Record<string, any[]>) || {}

    console.log('📋 Orders by cafeteria:')
    Object.entries(ordersByCafeteria).forEach(([cafeteriaId, orders]) => {
      console.log(`  ${cafeteriaId}: ${orders.length} orders`)
      orders.forEach(order => {
        console.log(`    - Order ${order.id}: ${order.status}, ${order.total_amount} EGP, ${order.created_at}`)
      })
    })

    console.log('🏪 Cafeterias:')
    cafeterias?.forEach(cafeteria => {
      console.log(`  ${cafeteria.id}: ${cafeteria.name} (owner: ${cafeteria.owner_id})`)
    })

    return NextResponse.json({
      success: true,
      data: {
        orders: orders || [],
        cafeterias: cafeterias || [],
        ordersByCafeteria,
        currentUser: profiles?.[0] || null,
        summary: {
          totalOrders: orders?.length || 0,
          totalCafeterias: cafeterias?.length || 0,
          ordersWithCafeteria: orders?.filter(o => o.cafeteria_id).length || 0,
          ordersWithoutCafeteria: orders?.filter(o => !o.cafeteria_id).length || 0
        }
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
