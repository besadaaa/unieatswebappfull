import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Disabling inventory trigger to prevent RLS conflicts...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Drop the trigger that's causing RLS issues
    const dropTriggerQuery = `
      DROP TRIGGER IF EXISTS create_inventory_alert_trigger ON inventory_items;
    `
    
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql: dropTriggerQuery
    })
    
    if (dropError) {
      console.error('Error dropping trigger:', dropError)
      return NextResponse.json({
        success: false,
        error: 'Failed to drop trigger',
        details: dropError
      }, { status: 500 })
    }
    
    console.log('✅ Successfully disabled inventory trigger')
    
    return NextResponse.json({
      success: true,
      message: 'Inventory trigger disabled successfully',
      details: {
        trigger: 'disabled',
        reason: 'RLS conflicts resolved by handling alerts in application code'
      }
    })

  } catch (error) {
    console.error('Error in disable inventory trigger API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
