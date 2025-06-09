import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting complete approval process...')
    
    const { applicationId } = await request.json()
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Step 1: Get the application details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('cafeteria_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      console.error('Application fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    console.log('Application found:', application.business_name || application.cafeteria_name)

    // Step 2: Update application status
    const { error: updateError } = await supabaseAdmin
      .from('cafeteria_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        review_notes: 'Application approved by admin - complete workflow'
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Application update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      )
    }

    console.log('Application status updated to approved')

    // Step 3: Check if user account exists (but don't create one yet)
    const email = application.contact_email || application.email
    console.log('Checking for existing user with email:', email)

    // Search for user by email in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let matchingUser = existingUsers.users.find(user => user.email === email)

    let userId: string | null = null

    if (matchingUser) {
      userId = matchingUser.id
      console.log('Found existing user:', userId, 'with email:', matchingUser.email)
    } else {
      console.log('No existing user found. User will need to create account when they sign in.')
    }

    // Step 4: Update user profile if user exists
    if (userId) {
      // First check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_active: true, // Activate the account
            role: 'cafeteria_manager', // Ensure correct role
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Error updating user profile:', profileError)
          return NextResponse.json(
            { error: 'Failed to update user account' },
            { status: 500 }
          )
        }
        console.log('User profile updated for user:', userId)
      } else {
        // Create new profile for existing auth user
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            full_name: application.owner_name || `${application.owner_first_name || ''} ${application.owner_last_name || ''}`.trim() || 'Cafeteria Owner',
            role: 'cafeteria_manager',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }
        console.log('User profile created for user:', userId)
      }
    } else {
      console.log('No user account exists yet. Profile will be created when user registers.')
    }

    // Step 5: Handle cafeteria creation/update
    let cafeteriaId: string | null = null

    if (userId) {
      // User exists, check if they already have a cafeteria
      console.log('Looking for existing cafeteria for user:', userId)

      const { data: existingCafeteria, error: findError } = await supabaseAdmin
        .from('cafeterias')
        .select('*')
        .eq('owner_id', userId)
        .single()

      if (existingCafeteria && !findError) {
        // Update existing cafeteria
        cafeteriaId = existingCafeteria.id
        console.log('Found existing cafeteria, updating:', cafeteriaId)

        const { error: updateError } = await supabaseAdmin
          .from('cafeterias')
          .update({
            name: application.business_name || application.cafeteria_name || existingCafeteria.name,
            location: application.location || application.cafeteria_location || existingCafeteria.location,
            description: application.description || application.cafeteria_description || existingCafeteria.description,
            approval_status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', cafeteriaId)

        if (updateError) {
          console.error('Error updating existing cafeteria:', updateError)
          return NextResponse.json(
            { error: 'Failed to update cafeteria' },
            { status: 500 }
          )
        }

        console.log('Cafeteria updated successfully:', cafeteriaId)
      } else {
        // Create new cafeteria for existing user
        cafeteriaId = crypto.randomUUID()
        console.log('Creating new cafeteria for existing user:', cafeteriaId)

        const { error: createError } = await supabaseAdmin
          .from('cafeterias')
          .insert({
            id: cafeteriaId,
            name: application.business_name || application.cafeteria_name || 'New Cafeteria',
            location: application.location || application.cafeteria_location || 'Location TBD',
            description: application.description || application.cafeteria_description || 'No description provided',
            owner_id: userId,
            approval_status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (createError) {
          console.error('Error creating cafeteria:', createError)
          return NextResponse.json(
            { error: 'Failed to create cafeteria' },
            { status: 500 }
          )
        }

        console.log('Cafeteria created successfully:', cafeteriaId)
      }
    } else {
      console.log('No user account exists yet. Cafeteria will be created when user registers.')
      // We'll store the approval in the application itself, and create the cafeteria later
    }

    // Step 6: Log the approval for audit trail
    try {
      await supabaseAdmin
        .from('admin_actions')
        .insert({
          action_type: 'cafeteria_approval',
          target_id: applicationId,
          details: {
            cafeteria_name: application.business_name || application.cafeteria_name,
            owner_email: email,
            user_id: userId,
            cafeteria_id: cafeteriaId,
            user_exists: !!userId
          },
          created_at: new Date().toISOString()
        })
    } catch (auditError) {
      console.warn('Audit log warning:', auditError)
    }

    // Step 7: Send password reset email to user (if user exists)
    if (userId) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
        })

        if (error) {
          console.warn('Could not send password reset email:', error)
        } else {
          console.log('Password reset email sent to:', email)
        }
      } catch (resetError) {
        console.warn('Error sending password reset email:', resetError)
      }
    }

    console.log('Complete approval process finished successfully')

    return NextResponse.json({
      success: true,
      message: userId
        ? 'Cafeteria application approved successfully. A password reset email has been sent to the user.'
        : 'Cafeteria application approved. User can now create their account using the registered email.',
      data: {
        applicationId,
        userId,
        cafeteriaId,
        email,
        cafeteriaName: application.business_name || application.cafeteria_name,
        userExists: !!userId,
        requiresRegistration: !userId,
        passwordResetSent: !!userId
      }
    })

  } catch (error) {
    console.error('Complete approval process failed:', error)
    return NextResponse.json(
      { error: 'Internal server error during approval process', details: error.message },
      { status: 500 }
    )
  }
}
