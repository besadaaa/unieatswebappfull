import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
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

    // Get all profiles (without join first to avoid issues)
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

    // Get all cafeterias separately
    const { data: allCafeterias, error: cafeteriasError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, approval_status, owner_id')

    if (cafeteriasError) {
      console.error('Error fetching cafeterias:', cafeteriasError)
      // Continue without cafeteria data rather than failing
    }

    // Combine auth users with their profiles
    const combinedUsers = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)

      // Get cafeteria information for this user
      const userCafeterias = allCafeterias?.filter(c => c.owner_id === authUser.id) || []
      const approvedCafeterias = userCafeterias.filter(c => c.approval_status === 'approved')
      const cafeteriaName = approvedCafeterias.length > 0
        ? approvedCafeterias.map(c => c.name).join(', ')
        : (userCafeterias.length > 0 ? `${userCafeterias[0].name} (Pending)` : null)

      return {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // Profile data
        full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
        role: profile?.role || 'student',
        phone: profile?.phone || null,
        theme: profile?.theme || 'light',
        notification_enabled: profile?.notification_enabled || false,
        is_active: profile?.is_active !== false,
        is_suspended: profile?.is_suspended || false,
        avatar_url: profile?.avatar_url || null,
        profile_created_at: profile?.created_at || null,
        status: profile?.is_active !== false ? 'active' : 'inactive',
        // Cafeteria data
        cafeteria_name: cafeteriaName,
        cafeterias_count: userCafeterias.length,
        approved_cafeterias_count: approvedCafeterias.length
      }
    })

    // Also include profiles that might not have auth users (edge case)
    const profilesWithoutAuth = profiles?.filter(profile =>
      !authUsers.users.some(authUser => authUser.id === profile.id)
    ) || []

    const orphanedProfiles = profilesWithoutAuth.map(profile => {
      const userCafeterias = allCafeterias?.filter(c => c.owner_id === profile.id) || []
      const approvedCafeterias = userCafeterias.filter(c => c.approval_status === 'approved')
      const cafeteriaName = approvedCafeterias.length > 0
        ? approvedCafeterias.map(c => c.name).join(', ')
        : (userCafeterias.length > 0 ? `${userCafeterias[0].name} (Pending)` : null)

      return {
        id: profile.id,
        email: 'No email (orphaned profile)',
        email_confirmed_at: null,
        created_at: null,
        last_sign_in_at: null,
        // Profile data
        full_name: profile.full_name || null,
        role: profile.role || 'student',
        phone: profile.phone || null,
        theme: profile.theme || 'light',
        notification_enabled: profile.notification_enabled || false,
        is_active: profile.is_active !== false,
        is_suspended: profile.is_suspended || false,
        avatar_url: profile.avatar_url || null,
        profile_created_at: profile.created_at || null,
        status: profile.is_active !== false ? 'active' : 'inactive',
        // Cafeteria data
        cafeteria_name: cafeteriaName,
        cafeterias_count: userCafeterias.length,
        approved_cafeterias_count: approvedCafeterias.length
      }
    })

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

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { email, password, full_name, role, phone, status = 'active' } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'cafeteria_manager', 'student']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, cafeteria_manager, or student' },
        { status: 400 }
      )
    }

    console.log('Creating user:', { email, full_name, role })

    // Create user in Supabase Auth using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name,
        role,
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 500 }
      )
    }

    console.log('Auth user created:', authData.user.id)

    // Create profile record with basic required fields
    const profileData: any = {
      id: authData.user.id,
      full_name,
      role
    }

    // Add optional fields if provided
    if (phone) {
      profileData.phone = phone
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error('Error creating profile:', profileError)

      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: `Failed to create user profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    console.log('Profile created successfully')

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
        phone,
        status,
        created_at: authData.user.created_at
      }
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    console.log('Updating user:', userId, updates)

    // Validate role if it's being updated
    if (updates.role) {
      const validRoles = ['admin', 'cafeteria_manager', 'student']
      if (!validRoles.includes(updates.role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, cafeteria_manager, or student' },
          { status: 400 }
        )
      }
    }

    // Prepare profile updates (only include fields that exist)
    const profileUpdates: any = {}

    // Only include fields that are safe to update
    if (updates.full_name) profileUpdates.full_name = updates.full_name
    if (updates.role) profileUpdates.role = updates.role
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone

    // Update profile data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: `Failed to update user profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // If updating user metadata (like full_name), also update auth user
    if (updates.full_name) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            full_name: updates.full_name,
            role: updates.role
          }
        }
      )

      if (authUpdateError) {
        console.error('Error updating auth user metadata:', authUpdateError)
        // Don't fail the whole operation, just log it
      }
    }

    console.log('User updated successfully')

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
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const force = searchParams.get('force') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Attempting to delete user:', userId, 'Force:', force)

    // Get user profile to check role and permissions
    const { data: userProfile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (profileFetchError) {
      console.error('Error fetching user profile:', profileFetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is an admin - prevent deletion
    if (userProfile.role === 'admin') {
      return NextResponse.json(
        {
          error: 'Cannot delete admin users',
          message: 'Admin users cannot be deleted for security reasons. You need special permissions to perform this action.',
          canDelete: false
        },
        { status: 403 }
      )
    }

    // Check if user is a cafeteria manager with active cafeterias
    if (userProfile.role === 'cafeteria_manager') {
      const { data: ownedCafeterias, error: cafeteriaError } = await supabaseAdmin
        .from('cafeterias')
        .select('id, name, approval_status')
        .eq('owner_id', userId)

      if (cafeteriaError) {
        console.error('Error checking cafeterias:', cafeteriaError)
        return NextResponse.json(
          { error: 'Error checking user cafeterias' },
          { status: 500 }
        )
      }

      const activeCafeterias = ownedCafeterias?.filter(c => c.approval_status === 'approved') || []

      if (activeCafeterias.length > 0 && !force) {
        return NextResponse.json(
          {
            error: 'Cannot delete cafeteria owner with active cafeterias',
            message: `This user owns ${activeCafeterias.length} approved cafeteria(s). Please revoke cafeteria approval first, then try deleting again.`,
            cafeterias: activeCafeterias.map(c => ({ id: c.id, name: c.name })),
            canDelete: false,
            requiresRevocation: true
          },
          { status: 409 }
        )
      }

      // If force delete or no active cafeterias, delete all associated cafeterias
      if (ownedCafeterias && ownedCafeterias.length > 0) {
        console.log(`Deleting ${ownedCafeterias.length} cafeterias for user ${userId}`)

        for (const cafeteria of ownedCafeterias) {
          const { error: deleteCafeteriaError } = await supabaseAdmin
            .from('cafeterias')
            .delete()
            .eq('id', cafeteria.id)

          if (deleteCafeteriaError) {
            console.error(`Error deleting cafeteria ${cafeteria.id}:`, deleteCafeteriaError)
          }
        }
      }
    }

    // Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      // Continue anyway, might not exist
    }

    // Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json(
        { error: `Failed to delete user from auth: ${authError.message}` },
        { status: 500 }
      )
    }

    console.log('User deleted successfully')

    return NextResponse.json({
      success: true,
      message: `User ${userProfile.full_name} deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
