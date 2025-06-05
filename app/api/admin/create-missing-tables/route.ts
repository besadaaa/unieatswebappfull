import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Creating missing inventory_alerts table...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Create inventory_alerts table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
        inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
        alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expired', 'expiring_soon')),
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableQuery
    })
    
    if (createError) {
      console.error('Error creating inventory_alerts table:', createError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create inventory_alerts table',
        details: createError
      }, { status: 500 })
    }
    
    // Enable RLS
    const enableRLSQuery = `
      ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
    `
    
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: enableRLSQuery
    })
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError)
    }
    
    // Create RLS policies
    const createPoliciesQuery = `
      CREATE POLICY IF NOT EXISTS "Cafeteria owners can view their inventory alerts" ON inventory_alerts
        FOR SELECT USING (
          cafeteria_id IN (
            SELECT id FROM cafeterias WHERE owner_id = auth.uid()
          )
        );
      
      CREATE POLICY IF NOT EXISTS "Cafeteria owners can manage their inventory alerts" ON inventory_alerts
        FOR ALL USING (
          cafeteria_id IN (
            SELECT id FROM cafeterias WHERE owner_id = auth.uid()
          )
        );
    `
    
    const { error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createPoliciesQuery
    })
    
    if (policiesError) {
      console.error('Error creating RLS policies:', policiesError)
    }
    
    // Create indexes
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_cafeteria_id ON inventory_alerts(cafeteria_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_inventory_item_id ON inventory_alerts(inventory_item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
    `
    
    const { error: indexesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createIndexesQuery
    })
    
    if (indexesError) {
      console.error('Error creating indexes:', indexesError)
    }
    
    console.log('✅ Successfully created inventory_alerts table')
    
    return NextResponse.json({
      success: true,
      message: 'inventory_alerts table created successfully',
      details: {
        table: 'inventory_alerts',
        rls: rlsError ? 'failed' : 'enabled',
        policies: policiesError ? 'failed' : 'created',
        indexes: indexesError ? 'failed' : 'created'
      }
    })

  } catch (error) {
    console.error('Error in create missing tables API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
