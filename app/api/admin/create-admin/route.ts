import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating admin user...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    const adminEmail = 'admin@unieats.com'
    const adminPassword = 'UniEats2025_Admin'
    
    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${adminEmail}`
    })

    let adminUserId: string

    if (existingUsers.users && existingUsers.users.length > 0) {
      // Admin user exists, use existing ID
      adminUserId = existingUsers.users[0].id
      console.log('✅ Admin user already exists:', adminUserId)
      
      // Update password just in case
      await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
        password: adminPassword
      })
    } else {
      // Create new admin user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin'
        }
      })

      if (authError) {
        console.error('❌ Error creating admin user:', authError)
        return NextResponse.json(
          { error: `Failed to create admin user: ${authError.message}` },
          { status: 500 }
        )
      }

      adminUserId = authData.user!.id
      console.log('✅ Created new admin user:', adminUserId)
    }

    // Create/update admin profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUserId,
        email: adminEmail,
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError)
      return NextResponse.json(
        { error: `Failed to create admin profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Admin profile created/updated successfully')

    // Also create a cafeteria manager for testing
    const cafeteriaEmail = 'cafeteria@unieats.com'
    const cafeteriaPassword = 'UniEats2025_Cafe'
    
    const { data: existingCafeterias } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${cafeteriaEmail}`
    })

    let cafeteriaUserId: string

    if (existingCafeterias.users && existingCafeterias.users.length > 0) {
      cafeteriaUserId = existingCafeterias.users[0].id
      console.log('✅ Cafeteria user already exists:', cafeteriaUserId)
      
      await supabaseAdmin.auth.admin.updateUserById(cafeteriaUserId, {
        password: cafeteriaPassword
      })
    } else {
      const { data: cafeteriaAuthData, error: cafeteriaAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: cafeteriaEmail,
        password: cafeteriaPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Cafeteria Manager',
          role: 'cafeteria_manager'
        }
      })

      if (cafeteriaAuthError) {
        console.log('⚠️ Warning: Could not create cafeteria user:', cafeteriaAuthError.message)
      } else {
        cafeteriaUserId = cafeteriaAuthData.user!.id
        console.log('✅ Created new cafeteria user:', cafeteriaUserId)
      }
    }

    if (cafeteriaUserId!) {
      // Create/update cafeteria profile
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: cafeteriaUserId,
          email: cafeteriaEmail,
          full_name: 'Cafeteria Manager',
          role: 'cafeteria_manager',
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      console.log('✅ Cafeteria profile created/updated successfully')
    }

    return NextResponse.json({
      success: true,
      message: 'Admin and cafeteria users created/updated successfully',
      admin_user_id: adminUserId,
      cafeteria_user_id: cafeteriaUserId || null
    })

  } catch (error) {
    console.error('❌ Admin creation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
