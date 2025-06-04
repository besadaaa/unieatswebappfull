import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Testing mobile app synchronization...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get the current status of the mobile order
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, created_at, total_amount, platform, user_id, student_id')
      .eq('id', '1d416abf-26b5-440e-ab76-9c847a0dd4fd')
      .single()

    if (fetchError) {
      console.error('Error fetching current order:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    console.log('📱 Current mobile order status:', currentOrder)

    // Test different status updates to see if mobile app responds
    const testStatuses = ['pending', 'preparing', 'ready', 'completed']
    const results = []

    for (const testStatus of testStatuses) {
      console.log(`🧪 Testing status update to: ${testStatus}`)
      
      // Update the order status
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: testStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', '1d416abf-26b5-440e-ab76-9c847a0dd4fd')
        .select()

      if (updateError) {
        console.error(`Error updating to ${testStatus}:`, updateError)
        results.push({
          status: testStatus,
          success: false,
          error: updateError.message
        })
      } else {
        console.log(`✅ Successfully updated to ${testStatus}`)
        results.push({
          status: testStatus,
          success: true,
          data: updatedOrder[0]
        })
      }

      // Wait 2 seconds between updates to allow mobile app to sync
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Set it back to pending for testing
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', '1d416abf-26b5-440e-ab76-9c847a0dd4fd')

    console.log('🔄 Reset order status back to pending')

    return NextResponse.json({
      success: true,
      message: 'Mobile sync test completed',
      data: {
        originalOrder: currentOrder,
        testResults: results,
        instructions: [
          '1. Check your mobile app during this test',
          '2. Pull down to refresh the orders screen',
          '3. Check if the order status changes in real-time',
          '4. Order has been reset to "pending" status'
        ]
      }
    })

  } catch (error) {
    console.error('Mobile sync test API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
