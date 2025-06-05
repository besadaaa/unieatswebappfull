import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Starting database schema fixes...')
    
    const supabase = createSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const results = {
      timestamp: new Date().toISOString(),
      fixes: [] as string[],
      errors: [] as string[]
    }

    // Fix 1: Add email column to profiles table
    try {
      console.log('📧 Checking profiles.email column...')
      
      // First check if column exists by trying to select it
      const { error: emailCheckError } = await supabase
        .from('profiles')
        .select('email')
        .limit(1)

      if (emailCheckError && emailCheckError.message.includes('does not exist')) {
        console.log('➕ Adding email column to profiles table...')
        
        const { error: addEmailError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
            
            -- Update email from auth.users table
            UPDATE profiles 
            SET email = auth_users.email 
            FROM auth.users AS auth_users 
            WHERE profiles.id = auth_users.id AND profiles.email IS NULL;
          `
        })

        if (addEmailError) {
          console.error('Error adding email column:', addEmailError)
          results.errors.push(`Failed to add email column: ${addEmailError.message}`)
        } else {
          results.fixes.push('Added email column to profiles table')
          console.log('✅ Email column added successfully')
        }
      } else {
        results.fixes.push('Email column already exists in profiles table')
        console.log('✅ Email column already exists')
      }
    } catch (error) {
      console.error('Error checking email column:', error)
      results.errors.push(`Email column check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Fix 2: Add status column to cafeterias table
    try {
      console.log('📊 Checking cafeterias.status column...')
      
      // Check if column exists
      const { error: statusCheckError } = await supabase
        .from('cafeterias')
        .select('status')
        .limit(1)

      if (statusCheckError && statusCheckError.message.includes('does not exist')) {
        console.log('➕ Adding status column to cafeterias table...')
        
        const { error: addStatusError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
            
            -- Set default status for existing cafeterias
            UPDATE cafeterias SET status = 'active' WHERE status IS NULL;
          `
        })

        if (addStatusError) {
          console.error('Error adding status column:', addStatusError)
          results.errors.push(`Failed to add status column: ${addStatusError.message}`)
        } else {
          results.fixes.push('Added status column to cafeterias table')
          console.log('✅ Status column added successfully')
        }
      } else {
        results.fixes.push('Status column already exists in cafeterias table')
        console.log('✅ Status column already exists')
      }
    } catch (error) {
      console.error('Error checking status column:', error)
      results.errors.push(`Status column check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Fix 3: Ensure other essential columns exist
    try {
      console.log('🔧 Ensuring other essential columns exist...')
      
      const { error: essentialColumnsError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add missing columns to profiles if they don't exist
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          
          -- Add missing columns to cafeterias if they don't exist
          ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Unnamed Cafeteria';
          ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS location TEXT;
          ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS owner_id UUID;
          ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          
          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
          CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
          CREATE INDEX IF NOT EXISTS idx_cafeterias_status ON cafeterias(status);
          CREATE INDEX IF NOT EXISTS idx_cafeterias_owner_id ON cafeterias(owner_id);
        `
      })

      if (essentialColumnsError) {
        console.error('Error adding essential columns:', essentialColumnsError)
        results.errors.push(`Failed to add essential columns: ${essentialColumnsError.message}`)
      } else {
        results.fixes.push('Ensured all essential columns exist')
        console.log('✅ Essential columns verified')
      }
    } catch (error) {
      console.error('Error adding essential columns:', error)
      results.errors.push(`Essential columns check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Summary
    const success = results.errors.length === 0
    const message = success 
      ? 'Database schema fixes completed successfully' 
      : `Completed with ${results.errors.length} errors`

    console.log(`✅ Database schema fixes completed: ${results.fixes.length} fixes, ${results.errors.length} errors`)

    return NextResponse.json({
      success,
      message,
      results,
      nextSteps: success ? [
        'Test the diagnostic endpoint again: /api/debug/production-issues',
        'Check user management in admin portal',
        'Check cafeteria approvals in admin portal'
      ] : [
        'Review the errors above',
        'Try running the SQL script manually in Supabase SQL Editor',
        'Contact support if issues persist'
      ]
    })

  } catch (error) {
    console.error('Database schema fix error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix database schema', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
