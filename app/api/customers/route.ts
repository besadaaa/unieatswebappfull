import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()

    console.log('Customer API called with userIds:', userIds)

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdmin()

    // First try to fetch from profiles table (only select columns that exist)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching customer profiles:', profilesError)
    }

    console.log('Profiles found:', profiles)

    // For users not found in profiles, fetch from auth.users table
    const missingUserIds = userIds.filter(userId =>
      !profiles?.find(p => p.id === userId && p.full_name)
    )

    console.log('Missing user IDs (not in profiles):', missingUserIds)

    // Ensure profiles have email and phone fields (even if null)
    const combinedProfiles = (profiles || []).map(profile => ({
      ...profile,
      email: null, // profiles table doesn't have email
      phone: null  // profiles table doesn't have phone
    }))

    // Fetch missing users from auth.users table one by one
    for (const userId of missingUserIds) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (authError) {
          console.error(`Error fetching auth user ${userId}:`, authError)
          // Add fallback profile
          combinedProfiles.push({
            id: userId,
            full_name: `User ${userId.slice(0, 8)}`,
            email: null,
            phone: null
          })
        } else if (authUser?.user) {
          // Extract name from auth user
          const user = authUser.user
          const fullName = user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email?.split('@')[0] ||
                          `User ${userId.slice(0, 8)}`

          combinedProfiles.push({
            id: userId,
            full_name: fullName,
            email: user.email || null,
            phone: user.user_metadata?.phone || user.phone || null
          })
        } else {
          // Add fallback profile
          combinedProfiles.push({
            id: userId,
            full_name: `User ${userId.slice(0, 8)}`,
            email: null,
            phone: null
          })
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error)
        // Add fallback profile
        combinedProfiles.push({
          id: userId,
          full_name: `User ${userId.slice(0, 8)}`,
          email: null,
          phone: null
        })
      }
    }

    console.log('Final combined profiles:', combinedProfiles)

    return NextResponse.json({
      success: true,
      profiles: combinedProfiles
    })

  } catch (error) {
    console.error('Error in customers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add a GET method for testing
export async function GET() {
  try {
    console.log('🔥 Customer API GET called for testing!')

    const supabaseAdmin = createSupabaseAdmin()

    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .limit(1)

    if (testError) {
      console.error('Test query error:', testError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: testError.message,
        status: 'error'
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Customer API is working',
      testData: testData || []
    })
  } catch (error) {
    console.error('Customer API GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 })
  }
}
