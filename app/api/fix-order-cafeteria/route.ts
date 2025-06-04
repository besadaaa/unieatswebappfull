import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Fixing order cafeteria assignment...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Update the mobile order to use the correct cafeteria
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        cafeteria_id: 'c6000000-0000-0000-0000-000000000006' // Current user's cafeteria
      })
      .eq('id', '1d416abf-26b5-440e-ab76-9c847a0dd4fd') // The mobile order ID
      .select()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    console.log('✅ Order updated successfully:', updatedOrder)

    return NextResponse.json({
      success: true,
      message: 'Order cafeteria updated successfully',
      data: updatedOrder
    })

  } catch (error) {
    console.error('Fix order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
