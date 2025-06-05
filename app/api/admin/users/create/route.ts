import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      // Temporary bypass: allow if no users exist in the system (initial setup)
      const supabaseAdmin = createSupabaseAdmin()
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()

      if (!existingUsers.users || existingUsers.users.length === 0) {
        console.log('🔧 No users exist, allowing initial admin setup')
      } else {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        )
      }
    }

    const { name, email, password, role, status } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Create user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: name,
        role: role || 'student'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: `Failed to create user account: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed - no user data returned' },
        { status: 400 }
      )
    }

    // Create profile in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: name,
        role: role || 'student',
        status: status || 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileError.message}` },
        { status: 400 }
      )
    }

    // Send welcome email notification
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: authData.user.id,
          title: 'Welcome to UniEats!',
          message: `Your account has been created successfully. You can now log in with your email: ${email}`,
          type: 'success',
          read: false
        })
    } catch (notificationError) {
      console.log('Failed to send welcome notification:', notificationError)
      // Don't fail the user creation for notification errors
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: email,
        full_name: name,
        role: role || 'student',
        status: status || 'active'
      }
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
