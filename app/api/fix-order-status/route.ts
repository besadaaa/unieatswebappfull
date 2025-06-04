import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Fixing order status to pending...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Update the mobile order status to pending
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'pending' // Change from 'completed' to 'pending'
      })
      .eq('id', '1d416abf-26b5-440e-ab76-9c847a0dd4fd') // Your mobile order ID
      .select()

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    console.log('✅ Order status updated successfully:', updatedOrder)

    return NextResponse.json({
      success: true,
      message: 'Order status updated to pending successfully',
      data: updatedOrder
    })

  } catch (error) {
    console.error('Fix order status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
