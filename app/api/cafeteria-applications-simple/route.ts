import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Simple version that doesn't use createSupabaseAdmin() to avoid hanging
export async function GET(request: NextRequest) {
  try {
    console.log('🔥 Simple Cafeteria Applications GET called')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Use regular supabase client instead of admin
    let query = supabase
      .from('cafeteria_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching cafeteria applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${applications?.length || 0} applications`)

    return NextResponse.json({
      success: true,
      applications: applications || []
    })

  } catch (error) {
    console.error('Error in simple cafeteria applications GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Simple Cafeteria Applications POST called')
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
      .select('id, status, business_name, cafeteria_name')
      .or(`contact_email.eq.${email},email.eq.${email}`)
      .or(`business_name.eq.${cafeteriaName},cafeteria_name.eq.${cafeteriaName}`)
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
        cafeteria_name: cafeteriaName,
        location: cafeteriaLocation,
        cafeteria_location: cafeteriaLocation,
        description: cafeteriaDescription,
        cafeteria_description: cafeteriaDescription,
        contact_phone: phone,
        phone: phone,
        contact_email: email,
        email: email,
        owner_name: `${ownerFirstName} ${ownerLastName}`,
        owner_first_name: ownerFirstName,
        owner_last_name: ownerLastName,
        website: '',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        temp_password: password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating cafeteria application:', applicationError)
      return NextResponse.json(
        { error: 'Failed to submit application', details: applicationError.message },
        { status: 500 }
      )
    }

    console.log('Application created successfully:', application.id)

    return NextResponse.json({
      success: true,
      message: 'Cafeteria application submitted successfully',
      applicationId: application.id
    })

  } catch (error) {
    console.error('Error in simple cafeteria application API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔥 Simple Cafeteria Applications PATCH called')
    const body = await request.json()
    const { applicationId, status, reviewNotes } = body

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update application status using regular supabase client
    const { data: application, error } = await supabase
      .from('cafeteria_applications')
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating cafeteria application:', error)
      return NextResponse.json(
        { error: 'Failed to update application', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Application ${applicationId} updated to ${status}`)

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application
    })

  } catch (error) {
    console.error('Error in simple cafeteria application PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
