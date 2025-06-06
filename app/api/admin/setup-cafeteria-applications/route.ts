import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up cafeteria_applications table...')
    
    const supabaseAdmin = createSupabaseAdmin()

    // Create cafeteria_applications table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS cafeteria_applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        location VARCHAR(500) NOT NULL,
        description TEXT,
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        website VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ,
        review_notes TEXT,
        temp_password VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableQuery
    })

    if (createError) {
      console.error('Error creating cafeteria_applications table:', createError)
      return NextResponse.json(
        { error: 'Failed to create cafeteria_applications table', details: createError },
        { status: 500 }
      )
    }

    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_status ON cafeteria_applications(status);',
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_email ON cafeteria_applications(contact_email);',
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_submitted ON cafeteria_applications(submitted_at);'
    ]

    for (const indexQuery of indexQueries) {
      const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
        sql: indexQuery
      })
      
      if (indexError) {
        console.warn('Index creation warning:', indexError.message)
      }
    }

    // Enable RLS (Row Level Security)
    const rlsQuery = `
      ALTER TABLE cafeteria_applications ENABLE ROW LEVEL SECURITY;
      
      -- Policy for admins to see all applications
      CREATE POLICY IF NOT EXISTS "Admins can view all cafeteria applications" 
      ON cafeteria_applications FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
      
      -- Policy for admins to update applications
      CREATE POLICY IF NOT EXISTS "Admins can update cafeteria applications" 
      ON cafeteria_applications FOR UPDATE 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
      
      -- Policy for public to insert applications (registration)
      CREATE POLICY IF NOT EXISTS "Anyone can submit cafeteria applications" 
      ON cafeteria_applications FOR INSERT 
      WITH CHECK (true);
    `

    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: rlsQuery
    })

    if (rlsError) {
      console.warn('RLS setup warning:', rlsError.message)
    }

    // Test the table by inserting a sample record
    const { data: testInsert, error: testError } = await supabaseAdmin
      .from('cafeteria_applications')
      .insert({
        business_name: 'Test Cafeteria',
        location: 'Test Location',
        description: 'Test description for setup verification',
        contact_phone: '+1234567890',
        contact_email: 'test@example.com',
        owner_name: 'Test Owner',
        status: 'pending'
      })
      .select()

    if (testError) {
      console.error('Test insert failed:', testError)
      return NextResponse.json(
        { error: 'Table created but test insert failed', details: testError },
        { status: 500 }
      )
    }

    // Clean up test record
    if (testInsert && testInsert.length > 0) {
      await supabaseAdmin
        .from('cafeteria_applications')
        .delete()
        .eq('id', testInsert[0].id)
    }

    console.log('Cafeteria applications table setup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Cafeteria applications table created and configured successfully'
    })

  } catch (error) {
    console.error('Error setting up cafeteria applications table:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
