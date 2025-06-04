import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json({
        error: 'orderIds array is required'
      }, { status: 400 })
    }

    console.log('Fetching order items for orders:', orderIds)

    // First, let's check what columns actually exist
    const { data: testItem, error: testError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('Error testing order_items structure:', testError)
      return NextResponse.json({
        error: 'Failed to test table structure: ' + testError.message
      }, { status: 500 })
    }

    console.log('Order items table structure (sample row):', testItem?.[0] || 'No data')

    // Fetch order items with menu item names using the correct field names
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        order_id,
        item_id,
        quantity,
        price,
        selected_variant
      `)
      .in('order_id', orderIds)

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError)
      return NextResponse.json({
        error: 'Failed to fetch order items: ' + orderItemsError.message
      }, { status: 500 })
    }

    // Fetch menu item names separately
    let enrichedOrderItems = orderItems || []
    if (orderItems && orderItems.length > 0) {
      const itemIds = [...new Set(orderItems.map(item => item.item_id).filter(Boolean))]

      if (itemIds.length > 0) {
        const { data: menuItems, error: menuError } = await supabaseAdmin
          .from('menu_items')
          .select('id, name')
          .in('id', itemIds)

        if (!menuError && menuItems) {
          enrichedOrderItems = orderItems.map(item => ({
            ...item,
            menu_items: menuItems.find(mi => mi.id === item.item_id) || { name: 'Unknown Item' }
          }))
        } else {
          console.error('Error fetching menu items:', menuError)
          enrichedOrderItems = orderItems.map(item => ({
            ...item,
            menu_items: { name: 'Unknown Item' }
          }))
        }
      }
    }

    console.log('Order items fetched successfully:', enrichedOrderItems?.length || 0)

    return NextResponse.json({
      success: true,
      orderItems: enrichedOrderItems
    })

  } catch (error) {
    console.error('Error in order-items API:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred: ' + (error as Error).message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({
        error: 'orderId parameter is required'
      }, { status: 400 })
    }

    console.log('Fetching order items for single order:', orderId)

    // Fetch order items with menu item names using the correct field names
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        item_id,
        quantity,
        price,
        selected_variant
      `)
      .eq('order_id', orderId)

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError)
      return NextResponse.json({
        error: 'Failed to fetch order items: ' + orderItemsError.message
      }, { status: 500 })
    }

    // Fetch menu item names separately
    let enrichedOrderItems = orderItems || []
    if (orderItems && orderItems.length > 0) {
      const itemIds = [...new Set(orderItems.map(item => item.item_id).filter(Boolean))]

      if (itemIds.length > 0) {
        const { data: menuItems, error: menuError } = await supabaseAdmin
          .from('menu_items')
          .select('id, name')
          .in('id', itemIds)

        if (!menuError && menuItems) {
          enrichedOrderItems = orderItems.map(item => ({
            ...item,
            menu_items: menuItems.find(mi => mi.id === item.item_id) || { name: 'Unknown Item' }
          }))
        } else {
          console.error('Error fetching menu items:', menuError)
          enrichedOrderItems = orderItems.map(item => ({
            ...item,
            menu_items: { name: 'Unknown Item' }
          }))
        }
      }
    }

    console.log('Order items fetched successfully:', enrichedOrderItems?.length || 0)

    return NextResponse.json({
      success: true,
      orderItems: enrichedOrderItems
    })

  } catch (error) {
    console.error('Error in order-items API:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred: ' + (error as Error).message
    }, { status: 500 })
  }
}
