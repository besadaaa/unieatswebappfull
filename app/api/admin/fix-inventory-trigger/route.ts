import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Fixing inventory trigger function...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Drop the existing trigger first
    const dropTriggerQuery = `
      DROP TRIGGER IF EXISTS create_inventory_alert_trigger ON inventory_items;
    `
    
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql: dropTriggerQuery
    })
    
    if (dropError) {
      console.error('Error dropping trigger:', dropError)
    }
    
    // Create the corrected trigger function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION create_inventory_alert()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only create alerts for low_stock and out_of_stock status changes
        IF NEW.status IN ('low_stock', 'out_of_stock') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
          -- Check if there's already an unresolved alert for this item and type
          IF NOT EXISTS (
            SELECT 1 FROM inventory_alerts ia
            WHERE ia.inventory_item_id = NEW.id 
              AND ia.alert_type = NEW.status 
              AND ia.is_resolved = false
          ) THEN
            -- Create the alert
            INSERT INTO inventory_alerts (
              cafeteria_id,
              inventory_item_id,
              alert_type,
              message,
              is_resolved
            ) VALUES (
              NEW.cafeteria_id,
              NEW.id,
              NEW.status,
              CASE 
                WHEN NEW.status = 'out_of_stock' THEN 
                  NEW.name || ' is out of stock'
                WHEN NEW.status = 'low_stock' THEN 
                  NEW.name || ' is running low (' || NEW.quantity || ' ' || NEW.unit || ' remaining)'
                ELSE 
                  NEW.name || ' status changed to ' || NEW.status
              END,
              false
            );
          END IF;
        END IF;
        
        -- Resolve alerts when status improves
        IF NEW.status = 'in_stock' AND OLD.status IN ('low_stock', 'out_of_stock') THEN
          UPDATE inventory_alerts 
          SET is_resolved = true, resolved_at = NOW()
          WHERE inventory_item_id = NEW.id 
            AND alert_type IN ('low_stock', 'out_of_stock')
            AND is_resolved = false;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createFunctionQuery
    })
    
    if (functionError) {
      console.error('Error creating function:', functionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create trigger function',
        details: functionError
      }, { status: 500 })
    }
    
    // Recreate the trigger
    const createTriggerQuery = `
      CREATE TRIGGER create_inventory_alert_trigger
        AFTER UPDATE ON inventory_items
        FOR EACH ROW
        EXECUTE FUNCTION create_inventory_alert();
    `
    
    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTriggerQuery
    })
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create trigger',
        details: triggerError
      }, { status: 500 })
    }
    
    console.log('✅ Successfully fixed inventory trigger function')
    
    return NextResponse.json({
      success: true,
      message: 'Inventory trigger function fixed successfully',
      details: {
        function: 'updated',
        trigger: 'recreated'
      }
    })

  } catch (error) {
    console.error('Error in fix inventory trigger API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
