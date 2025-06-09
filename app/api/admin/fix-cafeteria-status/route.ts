import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdmin()
    
    console.log('Fixing cafeteria status for user:', email)

    // Find the user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`
    })

    if (!users.users || users.users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users.users[0]
    console.log('Found user:', user.id, user.email)

    // Find the user's cafeteria
    const { data: cafeteria, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (cafeteriaError || !cafeteria) {
      return NextResponse.json(
        { error: 'Cafeteria not found for this user' },
        { status: 404 }
      )
    }

    console.log('Found cafeteria:', cafeteria.id, cafeteria.name, 'Current status:', cafeteria.status)

    // Update cafeteria status to active
    const { data: updatedCafeteria, error: updateError } = await supabaseAdmin
      .from('cafeterias')
      .update({
        status: 'active',
        approval_status: 'approved',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', cafeteria.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating cafeteria status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update cafeteria status', details: updateError.message },
        { status: 500 }
      )
    }

    // Also ensure the user profile is active
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.warn('Warning: Could not update profile status:', profileError)
    }

    console.log('Successfully updated cafeteria status to active')

    return NextResponse.json({
      success: true,
      message: 'Cafeteria status updated to active',
      user: {
        id: user.id,
        email: user.email
      },
      cafeteria: {
        id: updatedCafeteria.id,
        name: updatedCafeteria.name,
        status: updatedCafeteria.status,
        approval_status: updatedCafeteria.approval_status,
        is_active: updatedCafeteria.is_active
      }
    })

  } catch (error) {
    console.error('Error fixing cafeteria status:', error)
    return NextResponse.json(
      { error: 'Internal server error during status fix', details: error.message },
      { status: 500 }
    )
  }
}
