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

    // Step 3: Find the user account that should exist from registration
    const email = application.contact_email || application.email
    console.log('Looking for registered user with email:', email)

    // Search for user by email in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let matchingUser = existingUsers.users.find(user => user.email === email)

    if (!matchingUser) {
      console.error('No user account found for email:', email)
      return NextResponse.json(
        { error: `No user account found for email: ${email}. The user must register first before approval.` },
        { status: 400 }
      )
    }

    const userId = matchingUser.id
    console.log('Found registered user:', userId, 'with email:', matchingUser.email)

    // Step 4: Activate the user profile (enable login)
    console.log('Activating user profile for:', userId)

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: true, // ENABLE LOGIN
        is_suspended: false, // Ensure not suspended
        status: 'active', // Update status
        role: 'cafeteria_manager', // Ensure correct role
        full_name: application.owner_name || `${application.owner_first_name || ''} ${application.owner_last_name || ''}`.trim() || 'Cafeteria Owner',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error activating user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to activate user account' },
        { status: 500 }
      )
    }

    console.log('✅ User profile activated - user can now login with original password')

    // Step 5: Create or update cafeteria
    console.log('Creating/updating cafeteria for user:', userId)

    // Check if user already has a cafeteria
    const { data: existingCafeteria, error: findError } = await supabaseAdmin
      .from('cafeterias')
      .select('*')
      .eq('owner_id', userId)
      .single()

    let cafeteriaId: string

    if (existingCafeteria && !findError) {
      // Update existing cafeteria
      cafeteriaId = existingCafeteria.id
      console.log('Updating existing cafeteria:', cafeteriaId)

      const { data: updatedCafeteria, error: updateError } = await supabaseAdmin
        .from('cafeterias')
        .update({
          name: application.business_name || application.cafeteria_name || existingCafeteria.name,
          location: application.location || application.cafeteria_location || existingCafeteria.location,
          description: application.description || application.cafeteria_description || existingCafeteria.description,
          approval_status: 'approved',
          is_active: true, // Activate cafeteria
          operational_status: 'open', // Set operational status
          updated_at: new Date().toISOString()
        })
        .eq('id', cafeteriaId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating cafeteria:', updateError)
        return NextResponse.json(
          { error: 'Failed to update cafeteria' },
          { status: 500 }
        )
      }

      console.log('✅ Cafeteria updated and activated:', cafeteriaId, updatedCafeteria)
    } else {
      // Create new cafeteria
      cafeteriaId = crypto.randomUUID()
      console.log('Creating new cafeteria:', cafeteriaId)

      const { data: newCafeteria, error: createError } = await supabaseAdmin
        .from('cafeterias')
        .insert({
          id: cafeteriaId,
          name: application.business_name || application.cafeteria_name || 'New Cafeteria',
          location: application.location || application.cafeteria_location || 'Location TBD',
          description: application.description || application.cafeteria_description || 'No description provided',
          owner_id: userId,
          approval_status: 'approved',
          is_active: true, // Activate cafeteria
          operational_status: 'open', // Set operational status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating cafeteria:', createError)
        return NextResponse.json(
          { error: 'Failed to create cafeteria' },
          { status: 500 }
        )
      }

      console.log('✅ Cafeteria created and activated:', cafeteriaId, newCafeteria)
    }

    // Step 6: Update application with cafeteria_id link
    const { error: linkError } = await supabaseAdmin
      .from('cafeteria_applications')
      .update({
        cafeteria_id: cafeteriaId,
        review_notes: `Application approved and cafeteria activated successfully. Cafeteria ID: ${cafeteriaId}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (linkError) {
      console.warn('Warning: Could not link application to cafeteria:', linkError)
    }

    // Step 7: Log the approval for audit trail
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

    console.log('✅ Complete approval process finished successfully')

    return NextResponse.json({
      success: true,
      message: 'Cafeteria application approved successfully. User can now login with their original registration credentials.',
      data: {
        applicationId,
        userId,
        cafeteriaId,
        email,
        cafeteriaName: application.business_name || application.cafeteria_name,
        userActivated: true,
        canLogin: true
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
