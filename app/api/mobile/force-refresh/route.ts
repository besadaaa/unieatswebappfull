import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔄 Force refreshing orders for user:', userId)
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get all orders for the user with the latest status
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        student_id,
        cafeteria_id,
        status,
        total_amount,
        created_at,
        platform,
        pickup_time,
        order_number,
        payment_method,
        updated_at
      `)
      .or(`user_id.eq.${userId},student_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    console.log(`📱 Found ${orders?.length || 0} orders for user ${userId}`)

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: orderItems, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select(`
            id,
            quantity,
            price,
            selected_variant,
            item_id,
            menu_items (
              name,
              image_url,
              description
            )
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.error(`Error fetching items for order ${order.id}:`, itemsError)
          return { ...order, items: [] }
        }

        return {
          ...order,
          items: orderItems || []
        }
      })
    )

    // Get cafeteria info for each order
    const ordersWithCafeterias = await Promise.all(
      ordersWithItems.map(async (order) => {
        const { data: cafeteria, error: cafeteriaError } = await supabaseAdmin
          .from('cafeterias')
          .select('name, location')
          .eq('id', order.cafeteria_id)
          .single()

        if (cafeteriaError) {
          console.error(`Error fetching cafeteria for order ${order.id}:`, cafeteriaError)
          return { ...order, cafeteria: null }
        }

        return {
          ...order,
          cafeteria
        }
      })
    )

    console.log('✅ Successfully refreshed orders with items and cafeteria info')

    return NextResponse.json({
      success: true,
      message: 'Orders refreshed successfully',
      data: {
        orders: ordersWithCafeterias,
        timestamp: new Date().toISOString(),
        count: ordersWithCafeterias.length
      }
    })

  } catch (error) {
    console.error('Force refresh API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
