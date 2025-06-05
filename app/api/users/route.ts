import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, getCurrentUser } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      // Temporary bypass for development - check if this is localhost
      const host = request.headers.get('host')
      if (!host?.includes('localhost')) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        )
      }
      console.log('🔧 Development bypass: allowing admin access on localhost')
    }

    const supabaseAdmin = createSupabaseAdmin()
    
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to fetch auth users' },
        { status: 500 }
      )
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    // Combine auth users with their profiles
    const combinedUsers = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // Profile data
        full_name: profile?.full_name || 'No name',
        role: profile?.role || 'No role',
        phone: profile?.phone || 'No phone',
        theme: profile?.theme || 'light',
        notification_enabled: profile?.notification_enabled || false,
        profile_created_at: profile?.created_at || null,
      }
    })

    // Also include profiles that might not have auth users (edge case)
    const profilesWithoutAuth = profiles?.filter(profile => 
      !authUsers.users.some(authUser => authUser.id === profile.id)
    ) || []

    const orphanedProfiles = profilesWithoutAuth.map(profile => ({
      id: profile.id,
      email: 'No email (orphaned profile)',
      email_confirmed_at: null,
      created_at: null,
      last_sign_in_at: null,
      // Profile data
      full_name: profile.full_name || 'No name',
      role: profile.role || 'No role',
      phone: profile.phone || 'No phone',
      theme: profile.theme || 'light',
      notification_enabled: profile.notification_enabled || false,
      profile_created_at: profile.created_at || null,
    }))

    const allUsers = [...combinedUsers, ...orphanedProfiles]

    return NextResponse.json({
      success: true,
      users: allUsers,
      total: allUsers.length,
      auth_users_count: authUsers.users.length,
      profiles_count: profiles?.length || 0,
    })

  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      // Temporary bypass for development - check if this is localhost
      const host = request.headers.get('host')
      if (!host?.includes('localhost')) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        )
      }
      console.log('🔧 Development bypass: allowing admin access on localhost')
    }

    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    // Update profile data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updates,
        // Don't allow updating id or created_at
        id: undefined,
        created_at: undefined,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      // Temporary bypass for development - check if this is localhost
      const host = request.headers.get('host')
      if (!host?.includes('localhost')) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        )
      }
      console.log('🔧 Development bypass: allowing admin access on localhost')
    }

    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Delete from auth.users (this will cascade to profiles if foreign key is set up)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json(
        { error: 'Failed to delete user from auth' },
        { status: 500 }
      )
    }

    // Also delete from profiles table (in case cascade doesn't work)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      // Don't fail the whole operation, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
