import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Fixing RLS policies for inventory_alerts...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Drop existing policies
    const dropPoliciesQuery = `
      DROP POLICY IF EXISTS "Cafeteria owners can view their inventory alerts" ON inventory_alerts;
      DROP POLICY IF EXISTS "Cafeteria owners can manage their inventory alerts" ON inventory_alerts;
    `
    
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql: dropPoliciesQuery
    })
    
    if (dropError) {
      console.error('Error dropping policies:', dropError)
    }
    
    // Create new RLS policies that allow triggers to work
    const createPoliciesQuery = `
      -- Allow SELECT for cafeteria owners
      CREATE POLICY "Cafeteria owners can view their inventory alerts" ON inventory_alerts
        FOR SELECT USING (
          cafeteria_id IN (
            SELECT id FROM cafeterias WHERE owner_id = auth.uid()
          )
        );
      
      -- Allow INSERT for cafeteria owners and triggers
      CREATE POLICY "Allow inventory alert creation" ON inventory_alerts
        FOR INSERT WITH CHECK (
          cafeteria_id IN (
            SELECT id FROM cafeterias WHERE owner_id = auth.uid()
          )
          OR auth.uid() IS NULL  -- Allow triggers to insert
        );
      
      -- Allow UPDATE for cafeteria owners
      CREATE POLICY "Cafeteria owners can update their inventory alerts" ON inventory_alerts
        FOR UPDATE USING (
          cafeteria_id IN (
            SELECT id FROM cafeterias WHERE owner_id = auth.uid()
          )
        );
      
      -- Allow DELETE for cafeteria owners
      CREATE POLICY "Cafeteria owners can delete their inventory alerts" ON inventory_alerts
        FOR DELETE USING (
          cafeteria_id IN (
            SELECT id FROM cafeterias WHERE owner_id = auth.uid()
          )
        );
    `
    
    const { error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createPoliciesQuery
    })
    
    if (policiesError) {
      console.error('Error creating policies:', policiesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create RLS policies',
        details: policiesError
      }, { status: 500 })
    }
    
    console.log('✅ Successfully fixed RLS policies for inventory_alerts')
    
    return NextResponse.json({
      success: true,
      message: 'RLS policies fixed successfully',
      details: {
        policies: 'updated',
        trigger_support: 'enabled'
      }
    })

  } catch (error) {
    console.error('Error in fix RLS policies API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
