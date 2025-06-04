import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Get cafeteria data if user owns one
    const { data: cafeteria, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('*')
      .eq('owner_id', userId)
      .single()

    // Don't treat cafeteria error as fatal - user might not own a cafeteria
    if (cafeteriaError && cafeteriaError.code !== 'PGRST116') {
      console.error('Error fetching cafeteria:', cafeteriaError)
    }

    return NextResponse.json({
      success: true,
      profile,
      cafeteria: cafeteria || null
    })

  } catch (error) {
    console.error('Profile API error:', error)
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
    const { userId, profileUpdates, cafeteriaUpdates } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Updating profile for user:', userId)
    console.log('📝 Profile updates:', profileUpdates)
    console.log('🏪 Cafeteria updates:', cafeteriaUpdates)

    // Update profile if provided
    if (profileUpdates) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
      console.log('✅ Profile updated successfully')
    }

    // Update cafeteria if provided
    if (cafeteriaUpdates) {
      // Filter out any fields that don't exist in the cafeterias table
      const validCafeteriaFields = {
        name: cafeteriaUpdates.name,
        location: cafeteriaUpdates.location,
        description: cafeteriaUpdates.description,
        // Note: business_hours column doesn't exist in the table, so we exclude it
      }

      // Remove undefined fields
      const filteredUpdates = Object.fromEntries(
        Object.entries(validCafeteriaFields).filter(([_, value]) => value !== undefined)
      )

      console.log('🏪 Filtered cafeteria updates:', filteredUpdates)

      if (Object.keys(filteredUpdates).length > 0) {
        const { error: cafeteriaError } = await supabaseAdmin
          .from('cafeterias')
          .update(filteredUpdates)
          .eq('owner_id', userId)

        if (cafeteriaError) {
          console.error('Error updating cafeteria:', cafeteriaError)
          return NextResponse.json(
            { error: 'Failed to update cafeteria information' },
            { status: 500 }
          )
        }
        console.log('✅ Cafeteria updated successfully')
      } else {
        console.log('⚠️ No valid cafeteria fields to update')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
