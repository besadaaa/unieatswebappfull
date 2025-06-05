import { NextRequest, NextResponse } from 'next/server'
import { supabase, createSupabaseAdmin, getCurrentUser } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    const body = await request.json()
    console.log('Received registration data:', body)

    const {
      ownerFirstName,
      ownerLastName,
      email,
      phone,
      cafeteriaName,
      cafeteriaLocation,
      cafeteriaDescription,
      password
    } = body

    // Validate required fields
    if (!ownerFirstName || !ownerLastName || !email || !cafeteriaName || !cafeteriaLocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if an application already exists for this email and cafeteria name
    const { data: existingApplication, error: checkError } = await supabase
      .from('cafeteria_applications')
      .select('id, status, business_name')
      .eq('contact_email', email)
      .eq('business_name', cafeteriaName)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing application:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing applications' },
        { status: 500 }
      )
    }

    if (existingApplication) {
      return NextResponse.json(
        {
          error: `An application for "${cafeteriaName}" with this email already exists (Status: ${existingApplication.status})`,
          existingApplicationId: existingApplication.id
        },
        { status: 409 } // Conflict
      )
    }

    // Insert into cafeteria_applications table
    const { data: application, error: applicationError } = await supabase
      .from('cafeteria_applications')
      .insert({
        business_name: cafeteriaName,
        location: cafeteriaLocation,
        description: cafeteriaDescription,
        contact_phone: phone,
        contact_email: email,
        owner_name: `${ownerFirstName} ${ownerLastName}`,
        website: '', // Can be added later if needed
        status: 'pending',
        submitted_at: new Date().toISOString(),
        // Store password temporarily for profile creation (in real app, this should be more secure)
        temp_password: password, // We'll use this when creating the profile
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating cafeteria application:', applicationError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email to applicant
    // TODO: Notify admins of new application

    return NextResponse.json({
      success: true,
      message: 'Cafeteria application submitted successfully',
      applicationId: application.id
    })

  } catch (error) {
    console.error('Error in cafeteria application API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const supabaseAdmin = createSupabaseAdmin()
    let query = supabaseAdmin
      .from('cafeteria_applications')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching cafeteria applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applications: applications || []
    })

  } catch (error) {
    console.error('Error in cafeteria applications GET API:', error)
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

    const body = await request.json()
    const { applicationId, status, reviewNotes } = body

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update application status
    const supabaseAdmin = createSupabaseAdmin()
    const { data: application, error } = await supabaseAdmin
      .from('cafeteria_applications')
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
        // TODO: Add reviewed_by field with admin user ID
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating cafeteria application:', error)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // If approved, create user account, profile, and cafeteria record
    if (status === 'approved') {
      try {
        // 1. Check if user already exists, if not create user account in auth.users
        let authUserId: string

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
          filter: `email.eq.${application.contact_email}`
        })

        if (existingUsers.users && existingUsers.users.length > 0) {
          // User already exists, use existing user ID
          authUserId = existingUsers.users[0].id
          console.log('Using existing auth user:', authUserId)

          // Update password for existing user
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            { password: application.temp_password }
          )

          if (updateError) {
            console.error('Error updating password:', updateError)
          }
        } else {
          // Create new user
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: application.contact_email,
            password: application.temp_password,
            email_confirm: true, // Auto-confirm email
          })

          if (authError) {
            console.error('Error creating auth user:', authError)
            throw authError
          }

          authUserId = authUser.user!.id
          console.log('Created new auth user:', authUserId)
        }

        // 2. Create or update profile in profiles table (email is in auth.users, not profiles)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUserId,
            full_name: application.owner_name,
            phone: application.contact_phone,
            role: 'cafeteria_manager',
            status: 'active',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          throw profileError
        }

        console.log('Created/updated profile for user:', authUserId)

        // 3. Check if cafeteria already exists for this owner and application
        const { data: existingCafeteria, error: checkError } = await supabaseAdmin
          .from('cafeterias')
          .select('id, name, owner_id')
          .eq('owner_id', authUserId)
          .eq('name', application.business_name)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing cafeteria:', checkError)
          throw checkError
        }

        if (existingCafeteria) {
          // Cafeteria already exists, just update its status
          console.log('Cafeteria already exists, updating status:', existingCafeteria.id)

          const { error: updateError } = await supabaseAdmin
            .from('cafeterias')
            .update({
              approval_status: 'approved',
              is_active: true,
              is_open: true,
              // Update other fields in case they changed
              location: application.location,
              description: application.description,
            })
            .eq('id', existingCafeteria.id)

          if (updateError) {
            console.error('Error updating existing cafeteria:', updateError)
            throw updateError
          }

          console.log('Updated existing cafeteria record for:', application.business_name)
        } else {
          // Create new cafeteria record
          console.log('Creating new cafeteria record for:', application.business_name)

          const { error: cafeteriaError } = await supabaseAdmin
            .from('cafeterias')
            .insert({
              name: application.business_name,
              location: application.location,
              description: application.description,
              owner_id: authUserId, // Link to the user
              approval_status: 'approved',
              is_active: true,
              is_open: true,
              rating: 0,
              created_at: new Date().toISOString(),
            })

          if (cafeteriaError) {
            console.error('Error creating cafeteria record:', cafeteriaError)
            throw cafeteriaError
          }

          console.log('Created new cafeteria record for:', application.business_name)
        }

        // 4. Clear the temporary password from the application record
        await supabaseAdmin
          .from('cafeteria_applications')
          .update({ temp_password: null })
          .eq('id', applicationId)

      } catch (error) {
        console.error('Error in approval process:', error)
        // If any step fails, we should probably revert the status
        await supabaseAdmin
          .from('cafeteria_applications')
          .update({ status: 'pending', review_notes: `Approval failed: ${error}` })
          .eq('id', applicationId)

        return NextResponse.json(
          { error: 'Failed to complete approval process' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application
    })

  } catch (error) {
    console.error('Error in cafeteria application PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
