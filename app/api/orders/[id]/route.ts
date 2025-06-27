import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Fetching order details for ID:', params.id)
    const supabase = createSupabaseAdmin()
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('❌ Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Order not found', details: orderError.message },
        { status: 404 }
      )
    }

    console.log('📦 Found order:', order.id)

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        menu_items (
          name,
          price,
          description
        )
      `)
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('⚠️ Error fetching order items:', itemsError)
    }

    // Fetch customer details
    let customerDetails = {
      full_name: 'Unknown Customer',
      email: null,
      phone: null
    }

    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', order.user_id)
        .single()

      if (profile) {
        customerDetails = {
          full_name: profile.full_name || `User ${order.user_id.slice(0, 8)}`,
          email: profile.email,
          phone: profile.phone
        }
      }
    }

    // Fetch cafeteria details
    let cafeteriaDetails = null
    if (order.cafeteria_id) {
      const { data: cafeteria } = await supabase
        .from('cafeterias')
        .select('name, location, phone')
        .eq('id', order.cafeteria_id)
        .single()

      cafeteriaDetails = cafeteria
    }

    // Format order items
    const formattedOrderItems = orderItems?.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * parseFloat(item.price || '0'),
      notes: item.notes,
      menu_item_name: item.menu_items?.name || 'Unknown Item',
      menu_item_description: item.menu_items?.description || '',
      variant: item.selected_variant
    })) || []

    // Return complete order details in the expected format
    const orderDetails = {
      id: order.id,
      customer: customerDetails.full_name,
      items: formattedOrderItems,
      total: parseFloat(order.total_amount || '0'),
      status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown',
      created_at: order.created_at,
      pickup_time: order.pickup_time,
      delivery_address: order.delivery_address || 'Pickup',
      payment_method: order.payment_method || 'Cash',
      notes: order.notes || 'No special notes',
      customer_details: customerDetails,
      cafeteria_details: cafeteriaDetails,
      order_items: formattedOrderItems
    }

    console.log('✅ Returning order details with', formattedOrderItems.length, 'items')

    return NextResponse.json(orderDetails)

  } catch (error) {
    console.error('💥 Get order details error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdmin()
    const orderId = params.id
    const body = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(body)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    })

  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
