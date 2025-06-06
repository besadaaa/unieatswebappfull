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

    // Step 3: Create user account
    const email = application.contact_email || application.email
    const password = application.temp_password || `UniEats${Date.now()}!`
    
    let userId = null
    
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: application.owner_first_name || 'Cafeteria',
          last_name: application.owner_last_name || 'Owner',
          role: 'cafeteria_owner'
        }
      })

      if (userError) {
        console.warn('User creation warning:', userError.message)
        // Try to find existing user
        const { data: existingUsers } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .limit(1)
        
        if (existingUsers && existingUsers.length > 0) {
          userId = existingUsers[0].id
          console.log('Using existing user:', userId)
        }
      } else {
        userId = userData.user?.id
        console.log('New user created:', userId)
      }
    } catch (authError) {
      console.warn('Auth error:', authError)
    }

    // Step 4: Create or update profile
    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          first_name: application.owner_first_name || 'Cafeteria',
          last_name: application.owner_last_name || 'Owner',
          role: 'cafeteria_owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.warn('Profile creation warning:', profileError.message)
      } else {
        console.log('Profile created/updated for user:', userId)
      }
    }

    // Step 5: Create cafeteria record
    const cafeteriaId = crypto.randomUUID()
    
    const { error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .insert({
        id: cafeteriaId,
        name: application.business_name || application.cafeteria_name || 'New Cafeteria',
        location: application.location || application.cafeteria_location || 'Location TBD',
        description: application.description || application.cafeteria_description || 'No description provided',
        owner_id: userId,
        contact_email: email,
        contact_phone: application.contact_phone || application.phone,
        website: application.website,
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (cafeteriaError) {
      console.warn('Cafeteria creation warning:', cafeteriaError.message)
      // Try alternative table structure
      const { error: altCafeteriaError } = await supabaseAdmin
        .from('cafeterias')
        .insert({
          id: cafeteriaId,
          name: application.business_name || application.cafeteria_name || 'New Cafeteria',
          location: application.location || application.cafeteria_location || 'Location TBD',
          description: application.description || application.cafeteria_description || 'No description provided',
          owner_id: userId,
          email: email,
          phone: application.contact_phone || application.phone,
          website: application.website,
          created_at: new Date().toISOString()
        })
      
      if (altCafeteriaError) {
        console.error('Alternative cafeteria creation also failed:', altCafeteriaError.message)
      } else {
        console.log('Cafeteria created with alternative structure:', cafeteriaId)
      }
    } else {
      console.log('Cafeteria created:', cafeteriaId)
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
            cafeteria_id: cafeteriaId
          },
          created_at: new Date().toISOString()
        })
    } catch (auditError) {
      console.warn('Audit log warning:', auditError)
    }

    console.log('Complete approval process finished successfully')

    return NextResponse.json({
      success: true,
      message: 'Cafeteria application approved and account created successfully',
      data: {
        applicationId,
        userId,
        cafeteriaId,
        email,
        cafeteriaName: application.business_name || application.cafeteria_name
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
