import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Fixing cafeteria_applications table structure...')
    
    const supabaseAdmin = createSupabaseAdmin()

    // Check current table structure first
    const { data: currentColumns, error: checkError } = await supabaseAdmin
      .from('cafeteria_applications')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('Error checking table structure:', checkError)
      return NextResponse.json(
        { error: 'Failed to check table structure', details: checkError },
        { status: 500 }
      )
    }

    console.log('Table exists, checking for missing columns...')

    // Add missing columns if they don't exist
    const alterQueries = [
      // Core business information
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS cafeteria_name VARCHAR(255);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS location VARCHAR(500);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS cafeteria_location VARCHAR(500);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS description TEXT;`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS cafeteria_description TEXT;`,
      
      // Contact information
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
      
      // Owner information
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(255);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(255);`,
      
      // Additional fields
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS website VARCHAR(500);`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255);`,
      
      // Status and review fields
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS review_notes TEXT;`,
      
      // Timestamps
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
      `ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`
    ]

    let addedColumns = 0
    let errors = []

    for (const query of alterQueries) {
      try {
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
          sql: query
        })
        
        if (alterError) {
          if (!alterError.message.includes('already exists')) {
            console.warn('Column addition warning:', alterError.message)
            errors.push(alterError.message)
          }
        } else {
          addedColumns++
        }
      } catch (err) {
        console.warn('Error adding column:', err)
        errors.push(err.message)
      }
    }

    // Add constraints if they don't exist
    const constraintQueries = [
      `ALTER TABLE cafeteria_applications DROP CONSTRAINT IF EXISTS cafeteria_applications_status_check;`,
      `ALTER TABLE cafeteria_applications ADD CONSTRAINT cafeteria_applications_status_check 
       CHECK (status IN ('pending', 'approved', 'rejected'));`
    ]

    for (const query of constraintQueries) {
      try {
        const { error: constraintError } = await supabaseAdmin.rpc('exec_sql', {
          sql: query
        })
        
        if (constraintError) {
          console.warn('Constraint warning:', constraintError.message)
        }
      } catch (err) {
        console.warn('Error with constraint:', err)
      }
    }

    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_status ON cafeteria_applications(status);',
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_email ON cafeteria_applications(contact_email);',
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_email2 ON cafeteria_applications(email);',
      'CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_submitted ON cafeteria_applications(submitted_at);'
    ]

    for (const indexQuery of indexQueries) {
      try {
        const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
          sql: indexQuery
        })
        
        if (indexError) {
          console.warn('Index creation warning:', indexError.message)
        }
      } catch (err) {
        console.warn('Error creating index:', err)
      }
    }

    // Test the table structure by trying to insert a test record
    try {
      const testData = {
        business_name: 'Test Cafeteria',
        cafeteria_name: 'Test Cafeteria Alt',
        location: 'Test Location',
        cafeteria_location: 'Test Location Alt',
        description: 'Test description',
        cafeteria_description: 'Test description alt',
        contact_phone: '+1234567890',
        phone: '+1234567890',
        contact_email: 'test@example.com',
        email: 'test@example.com',
        owner_name: 'Test Owner',
        owner_first_name: 'Test',
        owner_last_name: 'Owner',
        status: 'pending'
      }

      const { data: testInsert, error: testError } = await supabaseAdmin
        .from('cafeteria_applications')
        .insert(testData)
        .select()

      if (testError) {
        console.error('Test insert failed:', testError)
        return NextResponse.json(
          { 
            error: 'Table structure updated but test insert failed', 
            details: testError,
            addedColumns,
            warnings: errors
          },
          { status: 400 }
        )
      }

      // Clean up test record
      if (testInsert && testInsert.length > 0) {
        await supabaseAdmin
          .from('cafeteria_applications')
          .delete()
          .eq('id', testInsert[0].id)
      }

      console.log('Cafeteria applications table structure fixed successfully')

      return NextResponse.json({
        success: true,
        message: 'Cafeteria applications table structure updated successfully',
        addedColumns,
        warnings: errors.length > 0 ? errors : undefined
      })

    } catch (testErr) {
      console.error('Test operation failed:', testErr)
      return NextResponse.json(
        { 
          error: 'Table structure updated but test failed', 
          details: testErr.message,
          addedColumns,
          warnings: errors
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error fixing cafeteria applications table:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
