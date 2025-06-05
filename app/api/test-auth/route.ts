import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing authentication...')
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session:', session ? 'EXISTS' : 'NONE')
    console.log('Session error:', sessionError)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Auth user:', user ? user.email : 'NONE')
    console.log('User error:', userError)
    
    // Test getCurrentUser function
    const currentUser = await getCurrentUser()
    console.log('Current user from function:', currentUser ? `${currentUser.email} (${currentUser.role})` : 'NONE')
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    console.log('Profiles:', profiles?.length || 0)
    console.log('Profiles error:', profilesError)
    
    return NextResponse.json({
      success: true,
      session: session ? {
        user_id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role
      } : null,
      auth_user: user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        metadata: user.user_metadata
      } : null,
      current_user: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        full_name: currentUser.full_name
      } : null,
      profiles_count: profiles?.length || 0,
      profiles_error: profilesError?.message || null
    })

  } catch (error) {
    console.error('❌ Auth test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Auth test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
