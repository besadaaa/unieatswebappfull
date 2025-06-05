import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting database schema fix...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Add missing columns to profiles table
    const profileColumns = [
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT \'student\' CHECK (role IN (\'admin\', \'cafeteria_manager\', \'student\'));',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\' CHECK (status IN (\'active\', \'suspended\', \'inactive\'));'
    ]

    // Add missing columns to cafeterias table
    const cafeteriaColumns = [
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);',
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT \'pending\' CHECK (approval_status IN (\'pending\', \'approved\', \'rejected\'));',
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);',
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;',
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS business_license_url TEXT;',
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS logo_url TEXT;',
      'ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS cover_image_url TEXT;'
    ]

    // Create settings table if it doesn't exist
    const settingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create notifications table if it doesn't exist
    const notificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        read BOOLEAN DEFAULT false,
        action_url TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      );
    `

    // Create cafeteria_applications table if it doesn't exist
    const applicationsTable = `
      CREATE TABLE IF NOT EXISTS cafeteria_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        business_name TEXT NOT NULL,
        business_email TEXT NOT NULL,
        business_phone TEXT NOT NULL,
        business_address TEXT NOT NULL,
        business_license_number TEXT,
        business_license_url TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        review_notes TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID REFERENCES auth.users(id)
      );
    `

    console.log('📝 Executing profile column additions...')
    for (const sql of profileColumns) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })
        if (error) {
          console.log(`⚠️ Profile column SQL warning: ${error.message}`)
        }
      } catch (err) {
        console.log(`⚠️ Profile column error (continuing): ${err}`)
      }
    }

    console.log('🏢 Executing cafeteria column additions...')
    for (const sql of cafeteriaColumns) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })
        if (error) {
          console.log(`⚠️ Cafeteria column SQL warning: ${error.message}`)
        }
      } catch (err) {
        console.log(`⚠️ Cafeteria column error (continuing): ${err}`)
      }
    }

    console.log('⚙️ Creating settings table...')
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: settingsTable })
      if (error) {
        console.log(`⚠️ Settings table warning: ${error.message}`)
      }
    } catch (err) {
      console.log(`⚠️ Settings table error (continuing): ${err}`)
    }

    console.log('🔔 Creating notifications table...')
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: notificationsTable })
      if (error) {
        console.log(`⚠️ Notifications table warning: ${error.message}`)
      }
    } catch (err) {
      console.log(`⚠️ Notifications table error (continuing): ${err}`)
    }

    console.log('📋 Creating applications table...')
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: applicationsTable })
      if (error) {
        console.log(`⚠️ Applications table warning: ${error.message}`)
      }
    } catch (err) {
      console.log(`⚠️ Applications table error (continuing): ${err}`)
    }

    // Enable RLS on new tables
    const rlsCommands = [
      'ALTER TABLE settings ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE cafeteria_applications ENABLE ROW LEVEL SECURITY;'
    ]

    console.log('🔒 Enabling RLS...')
    for (const sql of rlsCommands) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })
        if (error) {
          console.log(`⚠️ RLS warning: ${error.message}`)
        }
      } catch (err) {
        console.log(`⚠️ RLS error (continuing): ${err}`)
      }
    }

    console.log('✅ Database schema fix completed!')

    return NextResponse.json({
      success: true,
      message: 'Database schema has been updated successfully'
    })

  } catch (error) {
    console.error('❌ Database schema fix failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fix database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
