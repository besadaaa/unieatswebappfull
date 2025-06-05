import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up initial admin user...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Create admin user
    const adminEmail = 'admin@unieats.com'
    const adminPassword = 'UniEats2025_Admin'
    
    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUsers.users?.some(user => user.email === adminEmail)
    
    let adminUserId: string
    
    if (adminExists) {
      const existingAdmin = existingUsers.users?.find(user => user.email === adminEmail)
      adminUserId = existingAdmin!.id
      console.log('✅ Admin user already exists')
      
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
        password: adminPassword,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin'
        }
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
        console.error('❌ Error creating admin:', authError)
        return NextResponse.json(
          { error: `Failed to create admin: ${authError.message}` },
          { status: 500 }
        )
      }

      adminUserId = authData.user!.id
      console.log('✅ Created admin user:', adminUserId)
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
      console.error('❌ Profile error:', profileError)
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}` },
        { status: 500 }
      )
    }

    // Create cafeteria user
    const cafeteriaEmail = 'cafeteria@unieats.com'
    const cafeteriaPassword = 'UniEats2025_Cafe'
    
    const cafeteriaExists = existingUsers.users?.some(user => user.email === cafeteriaEmail)
    let cafeteriaUserId: string
    
    if (cafeteriaExists) {
      const existingCafeteria = existingUsers.users?.find(user => user.email === cafeteriaEmail)
      cafeteriaUserId = existingCafeteria!.id
      console.log('✅ Cafeteria user already exists')
      
      await supabaseAdmin.auth.admin.updateUserById(cafeteriaUserId, {
        password: cafeteriaPassword,
        user_metadata: {
          full_name: 'Cafeteria Manager',
          role: 'cafeteria_manager'
        }
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
        console.log('⚠️ Cafeteria creation warning:', cafeteriaAuthError.message)
      } else {
        cafeteriaUserId = cafeteriaAuthData.user!.id
        console.log('✅ Created cafeteria user:', cafeteriaUserId)
      }
    }

    if (cafeteriaUserId!) {
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
    }

    console.log('✅ Setup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Initial setup completed successfully',
      admin_created: !adminExists,
      cafeteria_created: !cafeteriaExists,
      admin_email: adminEmail,
      cafeteria_email: cafeteriaEmail
    })

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
